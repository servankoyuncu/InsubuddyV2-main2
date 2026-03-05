import StoreKit
import Foundation

@MainActor
class StoreKitService: ObservableObject {

    static let shared = StoreKitService()

    static let monthlyID = "com.insubuddy.app.premium.monthly"
    static let yearlyID  = "com.insubuddy.app.premium.yearly"

    @Published var products: [Product] = []
    @Published var isPremium: Bool = false

    private var updateListenerTask: Task<Void, Error>?

    init() {
        updateListenerTask = listenForTransactions()
        Task {
            await loadProducts()
            await updatePremiumStatus()
        }
    }

    deinit {
        updateListenerTask?.cancel()
    }

    // MARK: - Load Products
    func loadProducts() async {
        do {
            products = try await Product.products(for: [
                StoreKitService.monthlyID,
                StoreKitService.yearlyID
            ])
        } catch {
            print("[StoreKit] Failed to load products: \(error)")
        }
    }

    // MARK: - Purchase
    func purchase(_ product: Product) async throws -> Bool {
        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await updatePremiumStatus()
            await transaction.finish()
            return true

        case .userCancelled:
            return false

        case .pending:
            return false

        @unknown default:
            return false
        }
    }

    // MARK: - Restore
    func restorePurchases() async {
        try? await AppStore.sync()
        await updatePremiumStatus()
    }

    // MARK: - Check Premium Status
    func updatePremiumStatus() async {
        var hasActive = false

        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                if transaction.productID == StoreKitService.monthlyID ||
                   transaction.productID == StoreKitService.yearlyID {
                    hasActive = true
                }
            } catch {
                print("[StoreKit] Transaction verification failed: \(error)")
            }
        }

        isPremium = hasActive
    }

    // MARK: - Listen for Background Updates (renewals, cancellations)
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try await self.checkVerified(result)
                    await self.updatePremiumStatus()
                    await transaction.finish()
                } catch {
                    print("[StoreKit] Transaction update failed: \(error)")
                }
            }
        }
    }

    // MARK: - Verify (StoreKit 2 does this locally — no server needed)
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreKitError.failedVerification
        case .verified(let safe):
            return safe
        }
    }

    enum StoreKitError: Error {
        case failedVerification
    }
}
