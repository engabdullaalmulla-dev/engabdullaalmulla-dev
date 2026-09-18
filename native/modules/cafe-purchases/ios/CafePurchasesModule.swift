import ExpoModulesCore

public final class CafePurchasesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CafePurchases")
    Events("onEntitlementChange")

    OnCreate { [weak self] in
      Task { @MainActor [weak self] in
        CafePurchaseStore.shared.onChange = { [weak self] detail in
          self?.sendEvent("onEntitlementChange", detail)
        }
        CafePurchaseStore.shared.start()
      }
    }
    OnDestroy {
      Task { @MainActor in CafePurchaseStore.shared.stop() }
    }
    AsyncFunction("getStatus") { (promise: Promise) in
      Task { @MainActor in promise.resolve(await CafePurchaseStore.shared.status()) }
    }
    AsyncFunction("purchase") { [weak self] (promise: Promise) in
      Task { @MainActor [weak self] in
        let controller = self?.appContext?.utilities?.currentViewController()
        promise.resolve(await CafePurchaseStore.shared.purchase(presenting: controller))
      }
    }
    AsyncFunction("restore") { (promise: Promise) in
      Task { @MainActor in promise.resolve(await CafePurchaseStore.shared.restore()) }
    }
  }
}
