import Foundation
import StoreKit
import UIKit

/// StoreKit is the only entitlement authority. No game save, web message or local
/// preference can confer ownership. StoreKit's signed on-device transaction cache
/// supports offline play; we do not persist an unverified entitlement boolean.
@MainActor
final class CafePurchaseStore {
  static let shared = CafePurchaseStore()
  // Proposed App Store Connect non-consumable. Create/configure it before release.
  static let productID = "com.almulla.cafelife.fullgame"

  private var product: Product?
  private var entitled = false
  private var verified = false
  private var busy = false
  // A verified purchase can precede StoreKit's entitlement-cache update. Keep
  // that actual transaction in native memory until the cache catches up.
  private var verifiedPurchaseAwaitingCache: Transaction?
  private var revokedTransactionIDs = Set<UInt64>()
  private var updates: Task<Void, Never>?
  var onChange: (([String: Any]) -> Void)?

  func start() {
    guard updates == nil else { return }
    updates = Task { [weak self] in
      for await result in Transaction.updates {
        guard !Task.isCancelled, let self else { return }
        switch result {
        case .verified(let transaction):
          guard transaction.productID == Self.productID else { continue }
          if transaction.revocationDate != nil {
            self.revokedTransactionIDs.insert(transaction.id)
            if self.verifiedPurchaseAwaitingCache?.id == transaction.id { self.verifiedPurchaseAwaitingCache = nil }
          } else if transaction.productType == .nonConsumable && !transaction.isUpgraded {
            self.verifiedPurchaseAwaitingCache = transaction
          }
          await self.refreshEntitlement()
          self.onChange?(self.snapshot(status: "ready"))
          await transaction.finish()
        case .unverified(let transaction, _):
          guard transaction.productID == Self.productID else { continue }
          await self.refreshEntitlement()
          self.onChange?(self.snapshot(status: "error", error: "verificationFailed"))
          // Never finish or grant access for an unverified transaction.
        }
      }
    }
  }

  func stop() {
    updates?.cancel()
    updates = nil
    onChange = nil
  }

  private func refreshEntitlement() async {
    var owned = false
    var verificationFailed = false
    for await result in Transaction.currentEntitlements {
      switch result {
      case .verified(let transaction):
        if transaction.productID == Self.productID,
           transaction.productType == .nonConsumable,
           transaction.revocationDate == nil,
           !transaction.isUpgraded,
           !revokedTransactionIDs.contains(transaction.id) { owned = true }
      case .unverified(let transaction, _):
        if transaction.productID == Self.productID { verificationFailed = true }
      }
    }
    if owned {
      verifiedPurchaseAwaitingCache = nil
    } else if let purchased = verifiedPurchaseAwaitingCache,
              purchased.revocationDate == nil,
              !revokedTransactionIDs.contains(purchased.id) {
      // Only assigned in a verified purchase/update branch. An empty cache is
      // not evidence that this just-verified non-consumable was refunded.
      owned = true
    }
    entitled = owned
    verified = owned || !verificationFailed
  }

  private func loadProduct() async throws {
    let products = try await Product.products(for: [Self.productID])
    product = products.first { $0.id == Self.productID && $0.type == .nonConsumable }
  }

  private func snapshot(status: String, error: String? = nil) -> [String: Any] {
    var result: [String: Any] = [
      "status": status,
      "productId": Self.productID,
      "entitled": entitled && verified,
      "verified": verified,
      "available": product != nil && AppStore.canMakePayments,
      "localizedPrice": product?.displayPrice as Any? ?? NSNull()
    ]
    if let error { result["error"] = error }
    return result
  }

  func status() async -> [String: Any] {
    start()
    // Refresh access before contacting the store, so a catalogue outage never
    // removes an existing verified owner's offline entitlement.
    await refreshEntitlement()
    onChange?(snapshot(status: verified ? "ready" : "error", error: verified ? nil : "verificationFailed"))
    do {
      try await loadProduct()
      if !verified { return snapshot(status: "error", error: "verificationFailed") }
      if entitled { return snapshot(status: "ready") }
      if !AppStore.canMakePayments { return snapshot(status: "unavailable", error: "paymentsDisabled") }
      return snapshot(status: product == nil ? "unavailable" : "ready", error: product == nil ? "productUnavailable" : nil)
    } catch {
      return snapshot(status: entitled ? "ready" : "unavailable", error: "storeUnavailable")
    }
  }

  func purchase(presenting viewController: UIViewController?) async -> [String: Any] {
    if busy { return snapshot(status: "error", error: "busy") }
    busy = true
    defer { busy = false }
    start()
    await refreshEntitlement()
    if entitled && verified { return snapshot(status: "purchased") }
    guard AppStore.canMakePayments else { return snapshot(status: "unavailable", error: "paymentsDisabled") }
    do {
      try await loadProduct()
      guard let product else { return snapshot(status: "unavailable", error: "productUnavailable") }
      let result: Product.PurchaseResult
      if #available(iOS 18.2, *), let viewController {
        result = try await product.purchase(confirmIn: viewController)
      } else if #available(iOS 17.0, *), let scene = viewController?.view.window?.windowScene {
        result = try await product.purchase(confirmIn: scene)
      } else {
        result = try await product.purchase()
      }
      switch result {
      case .success(let verification):
        guard case .verified(let transaction) = verification,
              transaction.productID == Self.productID,
              transaction.productType == .nonConsumable,
              transaction.revocationDate == nil,
              !transaction.isUpgraded else {
          await refreshEntitlement()
          return snapshot(status: "error", error: "verificationFailed")
        }
        // Grant only after the actual signed transaction has been verified.
        verifiedPurchaseAwaitingCache = transaction
        entitled = true
        verified = true
        let response = snapshot(status: "purchased")
        onChange?(response)
        await transaction.finish()
        return response
      case .pending:
        return snapshot(status: "pending")
      case .userCancelled:
        return snapshot(status: "cancelled")
      @unknown default:
        return snapshot(status: "error", error: "failed")
      }
    } catch StoreKitError.userCancelled {
      return snapshot(status: "cancelled")
    } catch {
      await refreshEntitlement()
      return snapshot(status: "error", error: "storeUnavailable")
    }
  }

  func restore() async -> [String: Any] {
    if busy { return snapshot(status: "error", error: "busy") }
    busy = true
    defer { busy = false }
    start()
    do {
      // This can ask for App Store authentication: call only from Restore's tap.
      try await AppStore.sync()
      await refreshEntitlement()
      if !verified { return snapshot(status: "error", error: "verificationFailed") }
      return snapshot(status: "restored")
    } catch StoreKitError.userCancelled {
      return snapshot(status: "cancelled")
    } catch {
      await refreshEntitlement()
      return snapshot(status: "error", error: "storeUnavailable")
    }
  }
}
