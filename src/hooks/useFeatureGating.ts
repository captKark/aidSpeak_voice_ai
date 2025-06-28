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