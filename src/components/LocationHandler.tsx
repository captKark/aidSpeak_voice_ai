import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationHandlerProps {
  onLocationUpdate: (location: LocationData | null) => void;
  className?: string;
}

export default function LocationHandler({ onLocationUpdate, className = '' }: LocationHandlerProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-request location on component mount
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setLocation(locationData);
        setLoading(false);
        onLocationUpdate(locationData);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
        onLocationUpdate(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (location) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (loading) return 'Getting location...';
    if (error) return error;
    if (location) return `Location acquired (±${Math.round(location.accuracy)}m)`;
    return 'Location not available';
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        ) : error ? (
          <AlertCircle className="w-5 h-5 text-red-600" />
        ) : location ? (
          <MapPin className="w-5 h-5 text-green-600" />
        ) : (
          <MapPin className="w-5 h-5 text-gray-400" />
        )}
        
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {error && (
        <button
          onClick={requestLocation}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}