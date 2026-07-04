import { Users, DollarSign, Wallet, Activity } from 'lucide-react';
import type { Profil } from './types';

interface ProfilsClientProps {
  profils: Profil;
}

export function ProfilsClient({ profils }: ProfilsClientProps) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-6 h-6 text-purple-600" />
        1️⃣ Profils Client
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Profil Fiscal</p>
          </div>
          <p className="text-lg font-bold text-blue-900">{profils.fiscal}</p>
        </div>
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-medium text-gray-600">Profil Patrimonial</p>
          </div>
          <p className="text-lg font-bold text-purple-900">{profils.patrimonial}</p>
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-medium text-gray-600">Profil Risque</p>
          </div>
          <p className="text-lg font-bold text-orange-900">{profils.risque}</p>
        </div>
      </div>
    </div>
  );
}
