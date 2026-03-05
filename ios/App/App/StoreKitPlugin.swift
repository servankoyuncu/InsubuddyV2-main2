import Foundation
import Capacitor

@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin {

    private var store: StoreKitService {
        return StoreKitService.shared
    }

    // Returns available subscription products from App Store
    @objc func getProducts(_ call: CAPPluginCall) {
        Task { @MainActor in
            await self.store.loadProducts()

            let productsData: [[String: Any]] = self.store.products.map { product in
                return [
                    "id": product.id,
                    "displayName": product.displayName,
                    "description": product.description,
                    "displayPrice": product.displayPrice
                ]
            }

            call.resolve(["products": productsData])
        }
    }

    // Returns current premium status by checking active entitlements
    @objc func checkPremium(_ call: CAPPluginCall) {
        Task { @MainActor in
            await self.store.updatePremiumStatus()
            call.resolve(["isPremium": self.store.isPremium])
        }
    }

    // Initiates a purchase for the given productId
    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }

        Task { @MainActor in
            // Load products if not yet loaded
            if self.store.products.isEmpty {
                await self.store.loadProducts()
            }

            guard let product = self.store.products.first(where: { $0.id == productId }) else {
                call.reject("Product not found: \(productId)")
                return
            }

            do {
                let success = try await self.store.purchase(product)
                call.resolve([
                    "success": success,
                    "isPremium": self.store.isPremium
                ])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    // Restores previous purchases (required by Apple)
    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task { @MainActor in
            await self.store.restorePurchases()
            call.resolve(["isPremium": self.store.isPremium])
        }
    }
}
