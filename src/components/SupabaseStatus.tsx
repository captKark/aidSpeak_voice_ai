import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SupabaseStatusProps {
  className?: string;
}

export default function SupabaseStatus({ className = '' }: SupabaseStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Test the connection by trying to fetch from the emergency_reports table
      const { error } = await supabase
        .from('emergency_reports')
        .select('report_id')
        .limit(1);

      setIsConnected(!error);
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Database className="w-4 h-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">Checking database...</span>
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Database not connected</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <CheckCircle className="w-4 h-4 text-green-500" />
      <span className="text-sm text-green-600">Database connected</span>
    </div>
  );
}