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