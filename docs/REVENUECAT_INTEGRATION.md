# 🚀 RevenueCat Integration Guide for AidSpeak Emergency Reporter

> **Complete step-by-step guide for implementing subscription functionality using RevenueCat SDK**

## 📋 Table of Contents

1. [Initial Setup & SDK Installation](#1-initial-setup--sdk-installation)
2. [RevenueCat Configuration](#2-revenuecat-configuration)
3. [Basic Subscription Implementation](#3-basic-subscription-implementation)
4. [Testing Purchase Flows](#4-testing-purchase-flows)
5. [Error Handling](#5-error-handling)
6. [Best Practices](#6-best-practices)
7. [Premium Features Integration](#7-premium-features-integration)

---

## 1. Initial Setup & SDK Installation

### Step 1.1: Install RevenueCat SDK

```bash
npm install react-native-purchases
```

### Step 1.2: Update Package.json

Add the RevenueCat dependency to your project:

```json
{
  "dependencies": {
    "react-native-purchases": "^7.0.0"
  }
}
```

### Step 1.3: Environment Variables Setup

Add your RevenueCat API keys to your `.env` file:

```env
# RevenueCat Configuration
VITE_REVENUECAT_PUBLIC_API_KEY=your_public_api_key_here
VITE_REVENUECAT_APPLE_API_KEY=your_apple_api_key_here
VITE_REVENUECAT_GOOGLE_API_KEY=your_google_api_key_here

# Existing environment variables
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VITE_GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 1.4: Update .env.example

```env
# RevenueCat Configuration
VITE_REVENUECAT_PUBLIC_API_KEY=your_public_api_key_here
VITE_REVENUECAT_APPLE_API_KEY=your_apple_api_key_here
VITE_REVENUECAT_GOOGLE_API_KEY=your_google_api_key_here

# Existing environment variables
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VITE_GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 2. RevenueCat Configuration

### Step 2.1: Create RevenueCat Service

Create a new service file for RevenueCat integration:

```typescript
// src/services/revenueCatService.ts
import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL
} from 'react-native-purchases';

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

      // Set up attribution if needed
      // Purchases.setAttributes({
      //   "$email": user.email,
      //   "$displayName": user.name
      // });

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
```

### Step 2.2: Create Subscription Types

```typescript
// src/types/subscription.ts
export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: 'month' | 'year';
  features: SubscriptionFeature[];
  isPopular?: boolean;
  revenueCatId: string;
}

export interface UserSubscription {
  isActive: boolean;
  tier?: SubscriptionTier;
  expirationDate?: Date;
  entitlements: string[];
}

export const SUBSCRIPTION_ENTITLEMENTS = {
  PREMIUM_TRANSLATION: 'premium_translation',
  PRIORITY_RESPONSE: 'priority_response',
  ADVANCED_TTS: 'advanced_tts',
  OFFLINE_MODE: 'offline_mode',
  FAMILY_SHARING: 'family_sharing',
  EMERGENCY_CONTACTS: 'emergency_contacts',
  REAL_TIME_DISPATCH: 'real_time_dispatch',
  MEDICAL_INTEGRATION: 'medical_integration',
  TEAM_COORDINATION: 'team_coordination',
  ANALYTICS: 'analytics',
  CUSTOM_PROTOCOLS: 'custom_protocols',
  WHITE_LABEL: 'white_label'
} as const;

export type SubscriptionEntitlement = typeof SUBSCRIPTION_ENTITLEMENTS[keyof typeof SUBSCRIPTION_ENTITLEMENTS];
```

---

## 3. Basic Subscription Implementation

### Step 3.1: Create Subscription Hook

```typescript
// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { revenueCatService, PurchaseResult } from '../services/revenueCatService';
import { UserSubscription, SubscriptionTier } from '../types/subscription';

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription>({
    isActive: false,
    entitlements: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionTier[]>([]);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    
    try {
      // Load subscription status
      const status = await revenueCatService.getSubscriptionStatus();
      setSubscription(status);
      
      // Load available plans
      const plans = await revenueCatService.getSubscriptionPlans();
      setAvailablePlans(plans as SubscriptionTier[]);
      
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseSubscription = async (planId: string): Promise<PurchaseResult> => {
    setIsLoading(true);
    
    try {
      const result = await revenueCatService.purchasePackage(planId);
      
      if (result.success) {
        // Reload subscription data
        await loadSubscriptionData();
      }
      
      return result;
    } catch (error) {
      console.error('Purchase failed:', error);
      return {
        success: false,
        error: 'Purchase failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async (): Promise<PurchaseResult> => {
    setIsLoading(true);
    
    try {
      const result = await revenueCatService.restorePurchases();
      
      if (result.success) {
        await loadSubscriptionData();
      }
      
      return result;
    } catch (error) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error: 'Failed to restore purchases.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const hasEntitlement = async (entitlement: string): Promise<boolean> => {
    return revenueCatService.hasEntitlement(entitlement);
  };

  return {
    subscription,
    availablePlans,
    isLoading,
    purchaseSubscription,
    restorePurchases,
    hasEntitlement,
    refreshSubscription: loadSubscriptionData
  };
}
```

### Step 3.2: Create Subscription Component

```typescript
// src/components/SubscriptionPlans.tsx
import React, { useState } from 'react';
import { Crown, Check, Loader2, Star, Zap, Shield, Globe } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { SubscriptionTier } from '../types/subscription';

interface SubscriptionPlansProps {
  onClose?: () => void;
  onPurchaseSuccess?: () => void;
}

export default function SubscriptionPlans({ onClose, onPurchaseSuccess }: SubscriptionPlansProps) {
  const { subscription, availablePlans, isLoading, purchaseSubscription, restorePurchases } = useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    setPurchasing(planId);
    setError(null);
    
    try {
      const result = await purchaseSubscription(planId);
      
      if (result.success) {
        console.log('✅ Purchase successful!');
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (error) {
      setError('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setError(null);
    
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        console.log('✅ Purchases restored!');
      } else {
        setError(result.error || 'Failed to restore purchases');
      }
    } catch (error) {
      setError('Failed to restore purchases');
    }
  };

  const getPlanIcon = (planId: string) => {
    if (planId.includes('basic')) return Shield;
    if (planId.includes('premium')) return Star;
    if (planId.includes('pro')) return Crown;
    return Zap;
  };

  const getPlanColor = (planId: string) => {
    if (planId.includes('basic')) return 'blue';
    if (planId.includes('premium')) return 'purple';
    if (planId.includes('pro')) return 'gold';
    return 'gray';
  };

  if (isLoading) {
    return (
      <div className="subscription-loading">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <span className="ml-3 text-lg font-medium">Loading subscription plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-plans">
      {/* Header */}
      <div className="subscription-header">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-12 h-12 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-3">
            Upgrade AidSpeak
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            Enhanced emergency features for better protection
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription.isActive && (
          <div className="current-subscription">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 mb-6">
              <div className="flex items-center space-x-3">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Active Subscription</p>
                  <p className="text-sm text-green-600">
                    {subscription.tier?.name || 'Premium Plan'} • 
                    Expires {subscription.expirationDate?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {availablePlans.map((plan) => {
          const Icon = getPlanIcon(plan.id);
          const color = getPlanColor(plan.id);
          const isPurchasing = purchasing === plan.id;
          const isCurrentPlan = subscription.tier?.id === plan.id;

          return (
            <div
              key={plan.id}
              className={`plan-card ${color} ${plan.isPopular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="popular-badge">
                  <Star className="w-4 h-4" />
                  <span>Most Popular</span>
                </div>
              )}

              {/* Plan Header */}
              <div className="plan-header">
                <div className="plan-icon">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="plan-pricing">
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">{plan.price.replace('$', '')}</span>
                  <span className="period">/{plan.duration}</span>
                </div>
              </div>

              {/* Features */}
              <div className="plan-features">
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <Check className="w-5 h-5 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="plan-action">
                {isCurrentPlan ? (
                  <button className="plan-button current" disabled>
                    <Check className="w-5 h-5" />
                    <span>Current Plan</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(plan.id)}
                    disabled={isPurchasing || isLoading}
                    className={`plan-button ${color} ${isPurchasing ? 'purchasing' : ''}`}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5" />
                        <span>Upgrade Now</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-display">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="subscription-footer">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleRestore}
            className="restore-button"
            disabled={isLoading}
          >
            Restore Purchases
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="close-button"
            >
              Maybe Later
            </button>
          )}
        </div>

        <div className="footer-info">
          <p className="text-sm text-gray-500 text-center">
            Subscriptions auto-renew. Cancel anytime in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Testing Purchase Flows

### Step 4.1: Test Environment Setup

```typescript
// src/utils/testUtils.ts
export const TEST_PRODUCTS = {
  BASIC_MONTHLY: 'aidspeak_basic_monthly_test',
  PREMIUM_MONTHLY: 'aidspeak_premium_monthly_test',
  PRO_MONTHLY: 'aidspeak_pro_monthly_test'
};

export const isTestEnvironment = (): boolean => {
  return import.meta.env.MODE === 'development' || 
         window.location.hostname === 'localhost';
};

export const getTestCustomerInfo = () => ({
  originalAppUserId: 'test_user_123',
  allPurchaseDates: {},
  allExpirationDates: {},
  entitlements: {
    active: {},
    all: {}
  },
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
  nonSubscriptionTransactions: [],
  firstSeen: new Date().toISOString(),
  originalApplicationVersion: '1.0.0',
  requestDate: new Date().toISOString()
});
```

### Step 4.2: Testing Component

```typescript
// src/components/SubscriptionTesting.tsx
import React, { useState } from 'react';
import { TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { revenueCatService } from '../services/revenueCatService';
import { isTestEnvironment, TEST_PRODUCTS } from '../utils/testUtils';

export default function SubscriptionTesting() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunning, setIsRunning] = useState(false);

  if (!isTestEnvironment()) {
    return null;
  }

  const runTests = async () => {
    setIsRunning(true);
    const results: Record<string, boolean> = {};

    try {
      // Test 1: Service availability
      results['service_available'] = revenueCatService.isAvailable();

      // Test 2: Load offerings
      try {
        const offerings = await revenueCatService.loadOfferings();
        results['load_offerings'] = offerings.length > 0;
      } catch {
        results['load_offerings'] = false;
      }

      // Test 3: Get subscription plans
      try {
        const plans = await revenueCatService.getSubscriptionPlans();
        results['get_plans'] = plans.length > 0;
      } catch {
        results['get_plans'] = false;
      }

      // Test 4: Customer info
      try {
        const customerInfo = await revenueCatService.getCustomerInfo();
        results['customer_info'] = customerInfo !== null;
      } catch {
        results['customer_info'] = false;
      }

      // Test 5: Subscription status
      try {
        const status = await revenueCatService.getSubscriptionStatus();
        results['subscription_status'] = typeof status.isActive === 'boolean';
      } catch {
        results['subscription_status'] = false;
      }

      setTestResults(results);
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestIcon = (passed: boolean | undefined) => {
    if (passed === undefined) return <div className="w-5 h-5" />;
    return passed ? 
      <CheckCircle className="w-5 h-5 text-green-600" /> : 
      <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="subscription-testing">
      <div className="p-6 rounded-xl bg-yellow-50 border border-yellow-200">
        <div className="flex items-center space-x-3 mb-4">
          <TestTube className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-bold text-yellow-800">
            RevenueCat Testing Suite
          </h3>
        </div>

        <div className="space-y-3 mb-6">
          <div className="test-item">
            {getTestIcon(testResults['service_available'])}
            <span>Service Available</span>
          </div>
          <div className="test-item">
            {getTestIcon(testResults['load_offerings'])}
            <span>Load Offerings</span>
          </div>
          <div className="test-item">
            {getTestIcon(testResults['get_plans'])}
            <span>Get Subscription Plans</span>
          </div>
          <div className="test-item">
            {getTestIcon(testResults['customer_info'])}
            <span>Customer Info</span>
          </div>
          <div className="test-item">
            {getTestIcon(testResults['subscription_status'])}
            <span>Subscription Status</span>
          </div>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="test-button"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Running Tests...</span>
            </>
          ) : (
            <>
              <TestTube className="w-5 h-5" />
              <span>Run Tests</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

---

## 5. Error Handling

### Step 5.1: Error Types and Handling

```typescript
// src/types/errors.ts
export enum SubscriptionErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  PURCHASE_CANCELLED = 'PURCHASE_CANCELLED',
  PURCHASE_FAILED = 'PURCHASE_FAILED',
  RESTORE_FAILED = 'RESTORE_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PRODUCT = 'INVALID_PRODUCT',
  RECEIPT_VALIDATION_FAILED = 'RECEIPT_VALIDATION_FAILED',
  USER_NOT_ALLOWED = 'USER_NOT_ALLOWED'
}

export interface SubscriptionError {
  type: SubscriptionErrorType;
  message: string;
  originalError?: Error;
  userMessage: string;
  retryable: boolean;
}

export const createSubscriptionError = (
  type: SubscriptionErrorType,
  message: string,
  originalError?: Error
): SubscriptionError => {
  const errorMap: Record<SubscriptionErrorType, { userMessage: string; retryable: boolean }> = {
    [SubscriptionErrorType.INITIALIZATION_FAILED]: {
      userMessage: 'Unable to initialize subscription service. Please check your connection.',
      retryable: true
    },
    [SubscriptionErrorType.PURCHASE_CANCELLED]: {
      userMessage: 'Purchase was cancelled.',
      retryable: false
    },
    [SubscriptionErrorType.PURCHASE_FAILED]: {
      userMessage: 'Purchase failed. Please try again.',
      retryable: true
    },
    [SubscriptionErrorType.RESTORE_FAILED]: {
      userMessage: 'Failed to restore purchases. Please try again.',
      retryable: true
    },
    [SubscriptionErrorType.NETWORK_ERROR]: {
      userMessage: 'Network error. Please check your connection and try again.',
      retryable: true
    },
    [SubscriptionErrorType.INVALID_PRODUCT]: {
      userMessage: 'This subscription is not available. Please try again later.',
      retryable: false
    },
    [SubscriptionErrorType.RECEIPT_VALIDATION_FAILED]: {
      userMessage: 'Unable to validate purchase. Please contact support.',
      retryable: false
    },
    [SubscriptionErrorType.USER_NOT_ALLOWED]: {
      userMessage: 'Purchase not allowed. Please check your device settings.',
      retryable: false
    }
  };

  const errorInfo = errorMap[type];

  return {
    type,
    message,
    originalError,
    userMessage: errorInfo.userMessage,
    retryable: errorInfo.retryable
  };
};
```

### Step 5.2: Error Boundary Component

```typescript
// src/components/SubscriptionErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class SubscriptionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Subscription error boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="subscription-error-boundary">
          <div className="p-8 rounded-xl bg-red-50 border border-red-200 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">
              Subscription Error
            </h3>
            <p className="text-red-700 mb-6">
              Something went wrong with the subscription system. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 6. Best Practices

### Step 6.1: Security Best Practices

```typescript
// src/utils/subscriptionSecurity.ts
export const validatePurchaseReceipt = async (receipt: string): Promise<boolean> => {
  // Implement server-side receipt validation
  try {
    const response = await fetch('/api/validate-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receipt })
    });
    
    const result = await response.json();
    return result.valid === true;
  } catch (error) {
    console.error('Receipt validation failed:', error);
    return false;
  }
};

export const sanitizeUserData = (userData: any) => {
  // Remove sensitive information before logging
  const { email, ...safeData } = userData;
  return {
    ...safeData,
    email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined
  };
};
```

### Step 6.2: Performance Optimization

```typescript
// src/hooks/useSubscriptionCache.ts
import { useState, useEffect, useCallback } from 'react';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

export function useSubscriptionCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = cache.get(key);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setData(cached.data);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      const result = await fetcher();
      
      // Update cache
      cache.set(key, { data: result, timestamp: now });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const invalidateCache = useCallback(() => {
    cache.delete(key);
    fetchData();
  }, [key, fetchData]);

  return { data, isLoading, error, refresh: fetchData, invalidateCache };
}
```

---

## 7. Premium Features Integration

### Step 7.1: Feature Gating

```typescript
// src/hooks/useFeatureGating.ts
import { useState, useEffect } from 'react';
import { revenueCatService } from '../services/revenueCatService';
import { SUBSCRIPTION_ENTITLEMENTS } from '../types/subscription';

export function useFeatureGating() {
  const [entitlements, setEntitlements] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntitlements();
  }, []);

  const loadEntitlements = async () => {
    setIsLoading(true);
    
    try {
      const status = await revenueCatService.getSubscriptionStatus();
      setEntitlements(new Set(status.entitlements));
    } catch (error) {
      console.error('Failed to load entitlements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    return entitlements.has(feature);
  };

  const requiresUpgrade = (feature: string): boolean => {
    return !hasFeature(feature);
  };

  return {
    hasFeature,
    requiresUpgrade,
    isLoading,
    refresh: loadEntitlements,
    // Specific feature checks
    hasPremiumTranslation: hasFeature(SUBSCRIPTION_ENTITLEMENTS.PREMIUM_TRANSLATION),
    hasPriorityResponse: hasFeature(SUBSCRIPTION_ENTITLEMENTS.PRIORITY_RESPONSE),
    hasAdvancedTTS: hasFeature(SUBSCRIPTION_ENTITLEMENTS.ADVANCED_TTS),
    hasOfflineMode: hasFeature(SUBSCRIPTION_ENTITLEMENTS.OFFLINE_MODE),
    hasFamilySharing: hasFeature(SUBSCRIPTION_ENTITLEMENTS.FAMILY_SHARING),
    hasEmergencyContacts: hasFeature(SUBSCRIPTION_ENTITLEMENTS.EMERGENCY_CONTACTS)
  };
}
```

### Step 7.2: Premium Feature Components

```typescript
// src/components/PremiumFeatureGate.tsx
import React from 'react';
import { Crown, Lock, ArrowRight } from 'lucide-react';

interface PremiumFeatureGateProps {
  feature: string;
  featureName: string;
  description: string;
  hasAccess: boolean;
  onUpgrade: () => void;
  children: React.ReactNode;
}

export default function PremiumFeatureGate({
  feature,
  featureName,
  description,
  hasAccess,
  onUpgrade,
  children
}: PremiumFeatureGateProps) {
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="premium-feature-gate">
      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {featureName}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {description}
          </p>
          
          <button
            onClick={onUpgrade}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
          >
            <Crown className="w-5 h-5" />
            <span>Upgrade Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Basic Setup
- [ ] Install RevenueCat SDK
- [ ] Configure environment variables
- [ ] Set up RevenueCat service
- [ ] Create subscription types
- [ ] Test basic initialization

### Phase 2: Core Features
- [ ] Implement subscription hook
- [ ] Create subscription plans component
- [ ] Add purchase flow
- [ ] Implement restore purchases
- [ ] Add error handling

### Phase 3: Testing
- [ ] Set up test environment
- [ ] Create testing component
- [ ] Test purchase flows
- [ ] Validate error scenarios
- [ ] Test restore functionality

### Phase 4: Premium Features
- [ ] Implement feature gating
- [ ] Create premium feature components
- [ ] Integrate with existing features
- [ ] Add subscription status display
- [ ] Test premium functionality

### Phase 5: Production
- [ ] Configure production API keys
- [ ] Set up server-side validation
- [ ] Add analytics tracking
- [ ] Implement subscription management
- [ ] Deploy and monitor

---

## 🚀 Next Steps

1. **Start with Phase 1** - Get the basic RevenueCat integration working
2. **Test thoroughly** - Use the testing component to validate all flows
3. **Implement premium features** - Add value for subscribers
4. **Monitor and optimize** - Track conversion rates and user feedback

This integration will transform AidSpeak into a sustainable emergency service platform with premium features that provide real value to users in crisis situations.