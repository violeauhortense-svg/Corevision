// Page de test simple pour vérifier que le routing fonctionne
import React from 'react';
import { useParams } from 'react-router';

export function TestPage() {
  const { token } = useParams<{ token: string }>();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600">Token reçu : <strong>{token}</strong></p>
        <p className="text-sm text-gray-500 mt-4">
          Si vous voyez cette page, le routing fonctionne !
        </p>
      </div>
    </div>
  );
}
