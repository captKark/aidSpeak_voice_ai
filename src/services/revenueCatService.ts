import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL
} from '@revenuecat/purchases';

export interface SubscriptionPlan {
  id: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  features: string[];
  isPopular?: boolean;
}

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

class RevenueCatService {
  private isInitialized = false;
  private currentOfferings: PurchasesOffering[] = [];

  // Subscription plans for AidSpeak
  private subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'aidspeak_basic_monthly',
      title: 'AidSpeak Basic',
      description: 'Essential emergency features',
      price: '$4.99',
      duration: 'month',
      features: [
        'Unlimited voice recordings',
        'Basic translation (10 languages)',
        'Standard emergency response',
        'Location tracking',
        'Audio playback'
      ]
    },
    {
      id: 'aidspeak_premium_monthly',
      title: 'AidSpeak Premium',
      description: 'Advanced multilingual emergency support',
      price: '$9.99',
      duration: 'month',
      isPopular: true,
      features: [
        'Everything in Basic',
        'Enhanced translation (100+ languages)',
        'Priority emergency response',
        'Advanced voice synthesis',
        'Offline emergency mode',
        'Family emergency sharing',
        'Emergency contact integration'
      ]
    },
    {
      id: 'aidspeak_pro_monthly',
      title: 'AidSpeak Pro',
      description: 'Professional emergency management',
      price: '$19.99',
      duration: 'month',
      features: [
        'Everything in Premium',
        'Real-time emergency dispatch',
        'Medical history integration',
        'Emergency team coordination',
        'Advanced analytics',
        'Custom emergency protocols',
        'White-label emergency system'
      ]
    }
  ];

  constructor() {
    this.initializeRevenueCat();
  }

  /**
   * Initialize RevenueCat SDK
   */
  private async initializeRevenueCat(): Promise<void> {
    try {
      const apiKey = this.getApiKey();
      
      if (!apiKey) {
        console.warn('RevenueCat API key not found. Subscription features will be disabled.');
        return;
      }

      // Configure RevenueCat
      Purchases.setLogLevel(LOG_LEVEL.INFO);
      
      // Initialize with platform-specific API key
      await Purchases.configure({
        apiKey: apiKey,
        appUserID: null, // Will be set when user logs in
        observerMode: false,
        userDefaultsSuiteName: undefined,
        useAmazonSandbox: false
      });

      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');
      
      // Load initial offerings
      await this.loadOfferings();
      
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get platform-specific API key
   */
  private getApiKey(): string {
    // For web/PWA, use the public API key
    return import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY || '';
  }

  /**
   * Load available offerings from RevenueCat
   */
  async loadOfferings(): Promise<PurchasesOffering[]> {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized');
      return [];
    }

    try {
      const offerings = await Purchases.getOfferings();
      this.currentOfferings = Object.values(offerings.all);
      
      console.log('📦 Loaded RevenueCat offerings:', this.currentOfferings.length);
      return this.currentOfferings;
      
    } catch (error) {
      console.error('Failed to load RevenueCat offerings:', error);
      return [];
    }
  }

  /**
   * Get subscription plans with pricing from RevenueCat
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const offerings = await this.loadOfferings();
    
    // Merge local plan data with RevenueCat pricing
    return this.subscriptionPlans.map(plan => {
      const offering = offerings.find(o => 
        o.availablePackages.some(p => p.identifier === plan.id)
      );
      
      if (offering) {
        const package_ = offering.availablePackages.find(p => p.identifier === plan.id);
        if (package_) {
          return {
            ...plan,
            price: package_.product.priceString
          };
        }
      }
      
      return plan;
    });
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(packageId: string): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'RevenueCat not initialized. Please check your API key configuration.'
      };
    }

    try {
      // Find the package in current offerings
      let targetPackage: PurchasesPackage | null = null;
      
      for (const offering of this.currentOfferings) {
        const package_ = offering.availablePackages.find(p => p.identifier === packageId);
        if (package_) {
          targetPackage = package_;
          break;
        }
      }

      if (!targetPackage) {
        return {
          success: false,
          error: `Package ${packageId} not found in available offerings.`
        };
      }

      console.log(`🛒 Purchasing package: ${packageId}`);
      
      const { customerInfo } = await Purchases.purchasePackage(targetPackage);
      
      console.log('✅ Purchase successful:', customerInfo);
      
      return {
        success: true,
        customerInfo
      };
      
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      
      const purchasesError = error as PurchasesError;
      
      return {
        success: false,
        error: this.handlePurchaseError(purchasesError)
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'RevenueCat not initialized.'
      };
    }

    try {
      console.log('🔄 Restoring purchases...');
      
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('✅ Purchases restored:', customerInfo);
      
      return {
        success: true,
        customerInfo
      };
      
    } catch (error) {
      console.error('❌ Restore failed:', error);
      
      return {
        success: false,
        error: 'Failed to restore purchases. Please try again.'
      };
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return false;
    }

    // Check if user has any active entitlements
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    return activeEntitlements.length > 0;
  }

  /**
   * Check if user has specific entitlement
   */
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return false;
    }

    return entitlementId in customerInfo.entitlements.active;
  }

  /**
   * Handle purchase errors with user-friendly messages
   */
  private handlePurchaseError(error: PurchasesError): string {
    switch (error.code) {
      case 'PURCHASE_CANCELLED':
        return 'Purchase was cancelled.';
      case 'PURCHASE_NOT_ALLOWED':
        return 'Purchase not allowed. Please check your device settings.';
      case 'PURCHASE_INVALID':
        return 'Invalid purchase. Please try again.';
      case 'PRODUCT_NOT_AVAILABLE':
        return 'This subscription is not available. Please try again later.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      case 'RECEIPT_ALREADY_IN_USE':
        return 'This purchase has already been processed.';
      case 'INVALID_RECEIPT':
        return 'Invalid receipt. Please contact support.';
      default:
        return error.message || 'Purchase failed. Please try again.';
    }
  }

  /**
   * Set user ID for RevenueCat
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await Purchases.logIn(userId);
      console.log(`✅ RevenueCat user ID set: ${userId}`);
    } catch (error) {
      console.error('Failed to set RevenueCat user ID:', error);
    }
  }

  /**
   * Log out user from RevenueCat
   */
  async logOut(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await Purchases.logOut();
      console.log('✅ RevenueCat user logged out');
    } catch (error) {
      console.error('Failed to log out from RevenueCat:', error);
    }
  }

  /**
   * Check if RevenueCat is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Get subscription status summary
   */
  async getSubscriptionStatus(): Promise<{
    isActive: boolean;
    plan?: string;
    expirationDate?: Date;
    entitlements: string[];
  }> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return {
        isActive: false,
        entitlements: []
      };
    }

    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    const isActive = activeEntitlements.length > 0;
    
    let plan: string | undefined;
    let expirationDate: Date | undefined;
    
    if (isActive) {
      const firstEntitlement = customerInfo.entitlements.active[activeEntitlements[0]];
      plan = firstEntitlement.productIdentifier;
      expirationDate = firstEntitlement.expirationDate ? new Date(firstEntitlement.expirationDate) : undefined;
    }

    return {
      isActive,
      plan,
      expirationDate,
      entitlements: activeEntitlements
    };
  }
}

export const revenueCatService = new RevenueCatService();