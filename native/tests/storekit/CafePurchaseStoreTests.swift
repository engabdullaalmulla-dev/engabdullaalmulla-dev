import XCTest
import UIKit
import StoreKit
import StoreKitTest

/// Uses Apple's local StoreKit runtime and the actual production service source.
/// This does not test App Store Connect, real payments, or a physical device.
@MainActor
final class CafePurchaseStoreTests: XCTestCase {
  private var presenter: UIViewController? {
    UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap { $0.windows }.first(where: { $0.isKeyWindow })?.rootViewController
  }

  private func fixture() async throws -> (SKTestSession, CafePurchaseStore) {
    let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "CafeLifePremium", withExtension: "storekit"))
    let session = try SKTestSession(contentsOf: url)
    session.resetToDefaultState()
    session.clearTransactions()
    session.disableDialogs = true
    session.storefront = "ARE"
    // clearTransactions is asynchronous with respect to StoreKit's native
    // transaction cache. Wait for the observable empty state, not a blind delay.
    let deadline = Date().addingTimeInterval(5)
    while true {
      var cacheHasPurchase = false
      for await result in Transaction.currentEntitlements {
        switch result {
        case .verified(let transaction), .unverified(let transaction, _):
          if transaction.productID == CafePurchaseStore.productID { cacheHasPurchase = true }
        }
      }
      if session.allTransactions().isEmpty && !cacheHasPurchase { break }
      guard Date() < deadline else { throw NSError(domain: "LocalStoreKitFixtureDidNotReset", code: 1) }
      try await Task.sleep(nanoseconds: 50_000_000)
    }
    let store = CafePurchaseStore()
    addTeardownBlock {
      await MainActor.run {
        store.stop()
        session.clearTransactions()
        session.resetToDefaultState()
      }
    }
    return (session, store)
  }

  func testFreshTrialLoadsApplesLocalizedProduct() async throws {
    let (_, store) = try await fixture()
    let result = await store.status()
    XCTAssertEqual(result["status"] as? String, "ready")
    XCTAssertEqual(result["entitled"] as? Bool, false)
    XCTAssertEqual(result["verified"] as? Bool, true)
    XCTAssertEqual(result["available"] as? Bool, true)
    XCTAssertFalse(try XCTUnwrap(result["localizedPrice"] as? String).isEmpty)
  }

  func testPurchaseAndFreshNativeReaderFindVerifiedOwnership() async throws {
    let (session, store) = try await fixture()
    let result = await store.purchase(presenting: presenter)
    XCTAssertEqual(session.allTransactions().count, 1, "A real local StoreKit transaction must exist after purchase")
    XCTAssertEqual(result["status"] as? String, "purchased")
    XCTAssertEqual(result["entitled"] as? Bool, true)
    XCTAssertEqual(result["verified"] as? Bool, true)
    // Production must preserve the verified purchase immediately, while Apple's
    // on-device cache is catching up; a foreground refresh must never relock it.
    var refreshPublishedFalse = false
    store.onChange = { value in if value["entitled"] as? Bool == false { refreshPublishedFalse = true } }
    let immediateRefresh = await store.status()
    XCTAssertEqual(immediateRefresh["entitled"] as? Bool, true)
    XCTAssertFalse(refreshPublishedFalse)
    let cacheDeadline = Date().addingTimeInterval(5)
    var nativeCacheOwns = false
    while Date() < cacheDeadline && !nativeCacheOwns {
      for await result in Transaction.currentEntitlements {
        if case .verified(let transaction) = result, transaction.productID == CafePurchaseStore.productID,
           transaction.revocationDate == nil { nativeCacheOwns = true }
      }
      if !nativeCacheOwns { try await Task.sleep(nanoseconds: 50_000_000) }
    }
    XCTAssertTrue(nativeCacheOwns, "The local StoreKit transaction must reach Apple's native entitlement cache within five seconds")
    let freshReader = CafePurchaseStore()
    let refreshed = await freshReader.status()
    freshReader.stop()
    XCTAssertEqual(refreshed["entitled"] as? Bool, true)
    XCTAssertEqual(refreshed["verified"] as? Bool, true)
  }

  func testRestoreWithoutPurchaseDoesNotUnlock() async throws {
    let (_, store) = try await fixture()
    let result = await store.restore()
    XCTAssertEqual(result["status"] as? String, "restored")
    XCTAssertEqual(result["entitled"] as? Bool, false)
    XCTAssertEqual(result["verified"] as? Bool, true)
  }

  func testRestoreFindsLocalAppStorePurchase() async throws {
    let (session, store) = try await fixture()
    _ = try await session.buyProduct(identifier: CafePurchaseStore.productID)
    let result = await store.restore()
    XCTAssertEqual(result["status"] as? String, "restored")
    XCTAssertEqual(result["entitled"] as? Bool, true)
    XCTAssertEqual(result["verified"] as? Bool, true)
  }

  func testRefundArrivesThroughTransactionListener() async throws {
    let (session, store) = try await fixture()
    let purchased = await store.purchase(presenting: presenter)
    XCTAssertEqual(purchased["entitled"] as? Bool, true)
    let revoked = expectation(description: "Verified refund updates native ownership")
    revoked.assertForOverFulfill = false
    store.onChange = { result in
      if result["verified"] as? Bool == true && result["entitled"] as? Bool == false { revoked.fulfill() }
    }
    let transaction = try XCTUnwrap(session.allTransactions().first)
    try session.refundTransaction(identifier: transaction.identifier)
    await fulfillment(of: [revoked], timeout: 10)
    let result = await store.status()
    XCTAssertEqual(result["entitled"] as? Bool, false)
  }

  func testAskToBuyStaysLockedThenUnlocksAfterApproval() async throws {
    let (session, store) = try await fixture()
    session.askToBuyEnabled = true
    let pending = await store.purchase(presenting: presenter)
    XCTAssertEqual(pending["status"] as? String, "pending")
    XCTAssertEqual(pending["entitled"] as? Bool, false)
    let approved = expectation(description: "Ask to Buy approval updates ownership")
    approved.assertForOverFulfill = false
    store.onChange = { result in
      if result["verified"] as? Bool == true && result["entitled"] as? Bool == true { approved.fulfill() }
    }
    let transaction = try XCTUnwrap(session.allTransactions().first)
    try session.approveAskToBuyTransaction(identifier: transaction.identifier)
    await fulfillment(of: [approved], timeout: 10)
  }

  func testCancelledApplePurchaseDoesNotUnlock() async throws {
    let (session, store) = try await fixture()
    try await session.setSimulatedError(.generic(.userCancelled), forAPI: .purchase)
    let result = await store.purchase(presenting: presenter)
    XCTAssertEqual(result["status"] as? String, "cancelled")
    XCTAssertEqual(result["entitled"] as? Bool, false)
  }

  func testCatalogueFailureRetainsVerifiedNativeOwnership() async throws {
    let (session, store) = try await fixture()
    let purchased = await store.purchase(presenting: presenter)
    XCTAssertEqual(purchased["entitled"] as? Bool, true, "Establish verified native ownership before simulating the outage")
    try await session.setSimulatedError(.generic(.networkError(URLError(.notConnectedToInternet))), forAPI: .loadProducts)
    let result = await store.status()
    XCTAssertEqual(result["status"] as? String, "ready")
    XCTAssertEqual(result["entitled"] as? Bool, true)
    XCTAssertEqual(result["verified"] as? Bool, true)
    XCTAssertEqual(result["error"] as? String, "storeUnavailable")
  }

  func testUnverifiedAppleTransactionDoesNotUnlock() async throws {
    let (session, store) = try await fixture()
    try await session.setSimulatedError(.verification(.invalidSignature), forAPI: .verification)
    let result = await store.purchase(presenting: presenter)
    XCTAssertEqual(result["status"] as? String, "error")
    XCTAssertEqual(result["error"] as? String, "verificationFailed")
    XCTAssertEqual(result["entitled"] as? Bool, false)
  }
}
