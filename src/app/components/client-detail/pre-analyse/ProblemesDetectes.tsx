import { AlertCircle, CheckCircle, Flame, Zap } from 'lucide-react';
import { getSeveriteColor } from './utils';
import type { Probleme } from './types';

interface ProblemesDetectesProps {
  problemes: Probleme[];
}

const getSeveriteIcon = (severite: 'high' | 'medium' | 'low') => {
  if (severite === 'high') return <Flame className="w-5 h-5 text-red-600" />;
  if (severite === 'medium') return <AlertCircle className="w-5 h-5 text-orange-600" />;
  return <Zap className="w-5 h-5 text-yellow-600" />;
};

export function ProblemesDetectes({ problemes }: ProblemesDetectesProps) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <AlertCircle className="w-6 h-6 text-red-600" />
        6️⃣ Points de vigilance ({problemes.length})
      </h3>
      {problemes.length === 0 ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-lg font-semibold text-green-900">Aucun problème majeur détecté</p>
          <p className="text-sm text-green-700 mt-2">Le patrimoine présente une structure saine</p>
        </div>
      ) : (
        <div className="space-y-3">
          {problemes.map((pb) => (
            <div key={pb.id} className={`border-2 rounded-lg p-4 ${getSeveriteColor(pb.severite)}`}>
              <div className="flex items-start gap-3">
                {getSeveriteIcon(pb.severite)}
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">{pb.titre}</h4>
                  <p className="text-sm mb-2">{pb.description}</p>
                  <div className="bg-white bg-opacity-50 rounded-lg p-3 mt-2">
                    <p className="text-xs font-medium mb-1">💡 Impact :</p>
                    <p className="text-xs">{pb.impact}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
