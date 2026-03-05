import { registerPlugin, Capacitor } from '@capacitor/core';

const StoreKitPlugin = registerPlugin('StoreKitPlugin');

/**
 * Hook for native iOS StoreKit 2 in-app purchases.
 * On web/Android, all methods return safe fallback values.
 */
export const useStoreKit = () => {
  const isNative = Capacitor.isNativePlatform();

  /**
   * Fetch available subscription products from App Store.
   * Returns { products: [{ id, displayName, displayPrice }] }
   */
  const getProducts = async () => {
    if (!isNative) return { products: [] };
    return await StoreKitPlugin.getProducts();
  };

  /**
   * Check if the current user has an active premium subscription.
   * Returns { isPremium: boolean }
   */
  const checkPremium = async () => {
    if (!isNative) return { isPremium: false };
    return await StoreKitPlugin.checkPremium();
  };

  /**
   * Purchase a subscription product.
   * @param {string} productId - e.g. 'com.insubuddy.app.premium.monthly'
   * Returns { success: boolean, isPremium: boolean }
   */
  const purchase = async (productId) => {
    if (!isNative) {
      throw new Error('In-app purchases are only available on the iOS app.');
    }
    return await StoreKitPlugin.purchase({ productId });
  };

  /**
   * Restore previous purchases (required by Apple).
   * Returns { isPremium: boolean }
   */
  const restorePurchases = async () => {
    if (!isNative) return { isPremium: false };
    return await StoreKitPlugin.restorePurchases();
  };

  return { getProducts, checkPremium, purchase, restorePurchases, isNative };
};
