
import React from 'react';
import PharmacyTestInterface from '@/components/PharmacyTestInterface';

const TestInterface = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interface de Test</h1>
          <p className="text-gray-600 mt-2">
            Testez et gérez les connexions aux pharmacies
          </p>
        </div>
        
        <PharmacyTestInterface />
      </div>
    </div>
  );
};

export default TestInterface;
