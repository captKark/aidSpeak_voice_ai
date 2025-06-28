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
                <h3 className="plan-name">{plan.title}</h3>
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