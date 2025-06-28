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