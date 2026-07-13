/**
 * ??? INTERFACE D'ADMINISTRATION DES BARÈMES FISCAUX
 * 
 * Permet de gérer dynamiquement :
 * - Barème IR (5 tranches)
 * - Barème IFI (6 tranches)
 * - Prélèvements sociaux
 * - Abattements et plafonds
 */

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle2, Info, ExternalLink } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';
import { useBaremesFiscaux } from '../../hooks/useBaremesFiscaux';

interface BaremeIRRow {
  min: number;
  max: number | null;
  taux: number;
  label: string;
}

interface BaremeIFIRow {
  min: number;
  max: number | null;
  taux: number;
  label: string;
}

interface PrelevementsSociaux {
  CSG: number;
  CRDS: number;
  PRELEVEMENT_SOLIDARITE: number;
  TOTAL: number;
}

interface Abattements {
  abattement10PourcentPlafond: number;
  abattement10PourcentPlancher: number;
  decoteCelibatairePlafond: number;
  decoteCouplePlafond: number;
  decoteCelibataireMax: number;
  decoteCoupleMax: number;
  microFoncierPlafond: number;
  microFoncierAbattement: number;
}

export function BaremesFiscauxAdmin() {
  const [annee, setAnnee] = useState('2026');
  const { baremes, loading, error, rechargerBaremes } = useBaremesFiscaux(annee);
  
  const [baremeIR, setBaremeIR] = useState<BaremeIRRow[]>([]);
  const [baremeIFI, setBaremeIFI] = useState<BaremeIFIRow[]>([]);
  const [prelevements, setPrelevements] = useState<PrelevementsSociaux>({
    CSG: 0.092,
    CRDS: 0.005,
    PRELEVEMENT_SOLIDARITE: 0.075,
    TOTAL: 0.172,
  });
  const [abattements, setAbattements] = useState<Abattements>({
    abattement10PourcentPlafond: 13522,
    abattement10PourcentPlancher: 472,
    decoteCelibatairePlafond: 1929,
    decoteCouplePlafond: 3191,
    decoteCelibataireMax: 873,
    decoteCoupleMax: 1444,
    microFoncierPlafond: 15000,
    microFoncierAbattement: 0.30,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reinitializing, setReinitializing] = useState(false);

  // Charger les barèmes au montage
  useEffect(() => {
    if (baremes) {
      setBaremeIR(baremes.baremeIR);
      setBaremeIFI(baremes.baremeIFI);
      setPrelevements(baremes.prelevementsSociaux);
      setAbattements(baremes.abattements);
    }
  }, [baremes]);

  // Réinitialiser aux barèmes officiels 2025
  const handleReinitialiser = async () => {
    if (!confirm('?? ATTENTION : Cette action va remplacer TOUS les barèmes par les valeurs officielles 2025 de service-public.fr.\n\nVoulez-vous continuer ?')) {
      return;
    }

    setReinitializing(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/baremes/${annee}/reinitialiser`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('? Barèmes réinitialisés:', result);

      setSaveSuccess(true);
      
      // Recharger les barèmes
      await rechargerBaremes();

      // Message de succès
      alert('? Barèmes réinitialisés avec succès aux valeurs officielles 2025 !');
      
      // Masquer le message après 3 secondes
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('? Erreur réinitialisation:', err);
      setSaveError(err instanceof Error ? err.message : 'Erreur inconnue');
      alert('? Erreur lors de la réinitialisation : ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setReinitializing(false);
    }
  };

  // Sauvegarder les barèmes
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      // Recalculer le total des prélèvements
      const totalPrelevements = prelevements.CSG + prelevements.CRDS + prelevements.PRELEVEMENT_SOLIDARITE;

      const response = await fetch(
        `${apiBaseUrl}/baremes/${annee}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            baremeIR,
            baremeIFI,
            prelevementsSociaux: {
              ...prelevements,
              TOTAL: totalPrelevements,
            },
            abattements,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('? Barèmes sauvegardés:', result);

      setSaveSuccess(true);
      
      // Recharger les barèmes pour mettre à jour le cache
      await rechargerBaremes();

      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('? Erreur sauvegarde:', err);
      setSaveError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  // Mettre à jour une tranche IR
  const updateIRTranche = (index: number, field: keyof BaremeIRRow, value: any) => {
    const newBareme = [...baremeIR];
    newBareme[index] = { ...newBareme[index], [field]: value };
    setBaremeIR(newBareme);
  };

  // Mettre à jour une tranche IFI
  const updateIFITranche = (index: number, field: keyof BaremeIFIRow, value: any) => {
    const newBareme = [...baremeIFI];
    newBareme[index] = { ...newBareme[index], [field]: value };
    setBaremeIFI(newBareme);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="size-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des barèmes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Barèmes fiscaux {annee}
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion dynamique des barèmes pour les calculs fiscaux
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={rechargerBaremes}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Recharger
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className={`size-4 ${saving ? 'animate-pulse' : ''}`} />
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Sources officielles */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Sources officielles pour vérifier les barèmes :</p>
              <ul className="space-y-1">
                <li>
                  <a
                    href="https://www.impots.gouv.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    impots.gouv.fr - Barème IR
                    <ExternalLink className="size-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.service-public.fr/particuliers/vosdroits/F1419"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    service-public.fr - Impôt sur le revenu
                    <ExternalLink className="size-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://bofip.impots.gouv.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    BOFIP - Documentation fiscale officielle
                    <ExternalLink className="size-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bouton de réinitialisation */}
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              <AlertCircle className="size-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-900">
                <p className="font-semibold mb-1">Barèmes incorrects ?</p>
                <p>Réinitialisez aux valeurs officielles 2025 de service-public.fr</p>
              </div>
            </div>
            <button
              onClick={handleReinitialiser}
              disabled={reinitializing}
              className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`size-4 ${reinitializing ? 'animate-spin' : ''}`} />
              {reinitializing ? 'Réinitialisation...' : 'Réinitialiser aux barèmes 2025'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {saveSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600" />
            <span className="text-green-800">Barèmes sauvegardés avec succès !</span>
          </div>
        )}

        {saveError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="size-5 text-red-600" />
            <span className="text-red-800">{saveError}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="size-5 text-yellow-600" />
            <span className="text-yellow-800">{error}</span>
          </div>
        )}
      </div>

      {/* Barème IR */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Barème de l'impôt sur le revenu (IR)
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tranche</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Min (€)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Max (€)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Taux (%)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Label</th>
              </tr>
            </thead>
            <tbody>
              {baremeIR.map((tranche, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{index + 1}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={tranche.min}
                      onChange={(e) => updateIRTranche(index, 'min', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    {tranche.max === null ? (
                      <span className="text-gray-500 italic">Illimité</span>
                    ) : (
                      <input
                        type="number"
                        value={tranche.max}
                        onChange={(e) => updateIRTranche(index, 'max', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      value={tranche.taux * 100}
                      onChange={(e) => updateIRTranche(index, 'taux', Number(e.target.value) / 100)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={tranche.label}
                      onChange={(e) => updateIRTranche(index, 'label', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barème IFI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Barème de l'IFI (Impôt sur la Fortune Immobilière)
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tranche</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Min (€)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Max (€)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Taux (%)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Label</th>
              </tr>
            </thead>
            <tbody>
              {baremeIFI.map((tranche, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{index + 1}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={tranche.min}
                      onChange={(e) => updateIFITranche(index, 'min', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    {tranche.max === null ? (
                      <span className="text-gray-500 italic">Illimité</span>
                    ) : (
                      <input
                        type="number"
                        value={tranche.max}
                        onChange={(e) => updateIFITranche(index, 'max', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.001"
                      value={tranche.taux * 100}
                      onChange={(e) => updateIFITranche(index, 'taux', Number(e.target.value) / 100)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={tranche.label}
                      onChange={(e) => updateIFITranche(index, 'label', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prélèvements sociaux */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Prélèvements sociaux
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSG (%)
            </label>
            <input
              type="number"
              step="0.001"
              value={prelevements.CSG * 100}
              onChange={(e) =>
                setPrelevements({ ...prelevements, CSG: Number(e.target.value) / 100 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CRDS (%)
            </label>
            <input
              type="number"
              step="0.001"
              value={prelevements.CRDS * 100}
              onChange={(e) =>
                setPrelevements({ ...prelevements, CRDS: Number(e.target.value) / 100 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prélèvement solidarité (%)
            </label>
            <input
              type="number"
              step="0.001"
              value={prelevements.PRELEVEMENT_SOLIDARITE * 100}
              onChange={(e) =>
                setPrelevements({
                  ...prelevements,
                  PRELEVEMENT_SOLIDARITE: Number(e.target.value) / 100,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total (calculé)
            </label>
            <input
              type="number"
              step="0.001"
              value={
                (prelevements.CSG + prelevements.CRDS + prelevements.PRELEVEMENT_SOLIDARITE) * 100
              }
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Abattements et plafonds */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Abattements et plafonds
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plafond abattement 10% (€)
            </label>
            <input
              type="number"
              value={abattements.abattement10PourcentPlafond}
              onChange={(e) =>
                setAbattements({
                  ...abattements,
                  abattement10PourcentPlafond: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plancher abattement 10% (€)
            </label>
            <input
              type="number"
              value={abattements.abattement10PourcentPlancher}
              onChange={(e) =>
                setAbattements({
                  ...abattements,
                  abattement10PourcentPlancher: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plafond décote célibataire (€)
            </label>
            <input
              type="number"
              value={abattements.decoteCelibatairePlafond}
              onChange={(e) =>
                setAbattements({
                  ...abattements,
                  decoteCelibatairePlafond: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plafond décote couple (€)
            </label>
            <input
              type="number"
              value={abattements.decoteCouplePlafond}
              onChange={(e) =>
                setAbattements({
                  ...abattements,
                  decoteCouplePlafond: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Décote max célibataire (€)
            </label>
            <input
              type="number"
              value={abattements.decoteCelibataireMax}
              onChange={(e) =>
                setAbattements({
                  ...abattements,
                  decoteCelibataireMax: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Décote max couple (€)
            </label>
            <input
              type="number"
              value={abattements.decoteCoupleMax}
              onChange={(e) =>
                setAbattements({
                  ...abattements,
                  decoteCoupleMax: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plafond micro-foncier (€)
            </label>
            <input
              type="number"
              value={abattements.microFoncierPlafond}
              onChange={(e) =>
                setAbattements({
                  ...abattements,
                  microFoncierPlafond: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abattement micro-foncier (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={abattements.microFoncierAbattement * 100}
              onChange={(e) =>
                setAbattements({
                  ...abattements,
                  microFoncierAbattement: Number(e.target.value) / 100,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde en bas */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className={`size-5 ${saving ? 'animate-pulse' : ''}`} />
          {saving ? 'Sauvegarde en cours...' : 'Enregistrer tous les barèmes'}
        </button>
      </div>
    </div>
  );
}
