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