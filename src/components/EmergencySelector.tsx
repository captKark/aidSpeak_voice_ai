import React from 'react';
import { 
  Heart, 
  Flame, 
  CloudRain, 
  Shield, 
  Car, 
  AlertTriangle 
} from 'lucide-react';
import { EmergencyType } from '../types/emergency';

interface EmergencySelectorProps {
  selectedType: EmergencyType | null;
  onTypeSelect: (type: EmergencyType) => void;
  disabled?: boolean;
}

const emergencyTypes = [
  {
    type: 'medical' as EmergencyType,
    label: 'Medical Emergency',
    icon: Heart,
    gradient: 'from-red-500 to-pink-600',
    color: 'red'
  },
  {
    type: 'fire' as EmergencyType,
    label: 'Fire Emergency',
    icon: Flame,
    gradient: 'from-orange-500 to-red-600',
    color: 'orange'
  },
  {
    type: 'natural-disaster' as EmergencyType,
    label: 'Natural Disaster',
    icon: CloudRain,
    gradient: 'from-purple-500 to-indigo-600',
    color: 'purple'
  },
  {
    type: 'crime' as EmergencyType,
    label: 'Crime in Progress',
    icon: Shield,
    gradient: 'from-blue-500 to-cyan-600',
    color: 'blue'
  },
  {
    type: 'accident' as EmergencyType,
    label: 'Accident',
    icon: Car,
    gradient: 'from-yellow-500 to-orange-600',
    color: 'yellow'
  },
  {
    type: 'other' as EmergencyType,
    label: 'Other Emergency',
    icon: AlertTriangle,
    gradient: 'from-gray-500 to-slate-600',
    color: 'gray'
  }
];

export default function EmergencySelector({ selectedType, onTypeSelect, disabled }: EmergencySelectorProps) {
  const handleTypeSelect = (type: EmergencyType) => {
    if (disabled) return;
    
    // Simulate haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    onTypeSelect(type);
  };

  return (
    <div className="emergency-selector">
      <div className="selector-header">
        <h2 className="selector-title">
          Select Emergency Type
        </h2>
        <p className="selector-subtitle">
          Choose the category that best describes your emergency
        </p>
      </div>
      
      <div className="emergency-grid">
        {emergencyTypes.map(({ type, label, icon: Icon, gradient, color }) => (
          <button
            key={type}
            onClick={() => handleTypeSelect(type)}
            disabled={disabled}
            className={`emergency-card ${color} ${
              selectedType === type ? 'selected' : ''
            } ${disabled ? 'disabled' : ''}`}
            aria-label={`Select ${label}`}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 rounded-2xl ${
              selectedType === type ? 'opacity-10' : ''
            }`} />
            
            {/* Content */}
            <div className="emergency-content">
              <div className="emergency-icon-container">
                <Icon className="emergency-icon" />
              </div>
              
              <span className="emergency-label">
                {label}
              </span>
            </div>
            
            {/* Selection Indicator */}
            {selectedType === type && (
              <div className="selection-indicator">
                <div className="selection-check" />
              </div>
            )}
            
            {/* Hover Ring */}
            <div className={`absolute inset-0 rounded-2xl border-2 transition-all duration-300 ${
              selectedType === type 
                ? 'border-red-300' 
                : 'border-transparent hover:border-gray-200'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}