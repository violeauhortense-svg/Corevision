import { useState } from 'react';
import { Plus, X, Trash2, Pencil, CheckCircle2, XCircle, ArrowRight, FileCheck, Flag, Lightbulb } from 'lucide-react';
import type { AuditRecommendation, AuditRecommendationStatus, AuditRecommendationService, AuditRecommendationVendeur } from './types';

interface RecommandationsModuleProps {
  recommendations: AuditRecommendation[];
  onUpdate: (recommendations: AuditRecommendation[]) => Promise<void> | void;
}

const STATUS_LABELS: Record<AuditRecommendationStatus, string> = {
  proposee: '📝 Proposée',
  refusee: '❌ Refusée',
  acceptee: '✅ Acceptée',
  en_cours: '🔧 En cours',
  acte_finalise: '📄 Acte finalisé et transmis au client',
  termine: '🏁 Terminée',
};

const STATUS_COLORS: Record<AuditRecommendationStatus, string> = {
  proposee: 'bg-gray-100 text-gray-700 border-gray-300',
  refusee: 'bg-red-100 text-red-700 border-red-300',
  acceptee: 'bg-blue-100 text-blue-700 border-blue-300',
  en_cours: 'bg-amber-100 text-amber-700 border-amber-300',
  acte_finalise: 'bg-purple-100 text-purple-700 border-purple-300',
  termine: 'bg-green-100 text-green-700 border-green-300',
};

const SERVICE_LABELS: Record<AuditRecommendationService, string> = {
  juridique: '⚖️ Service juridique',
  investissement: '📈 Investissement',
  ingenierie_patrimoniale: '🏛️ Ingénierie patrimoniale',
};

const VENDEUR_LABELS: Record<AuditRecommendationVendeur, string> = {
  moi: '👤 Moi',
  lecler: '👤 M. Lecler',
  service_juridique: '⚖️ Service juridique',
  service_investissement: '📈 Service investissement',
};

function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

function emptyForm() {
  return { title: '', detail: '', chiffreAffaires: '', venduPar: '' as AuditRecommendationVendeur | '' };
}

export function RecommandationsModule({ recommendations, onUpdate }: RecommandationsModuleProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [choosingServiceFor, setChoosingServiceFor] = useState<string | null>(null);

  const persist = async (next: AuditRecommendation[]) => {
    await onUpdate(next);
  };

  const openNewForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEditForm = (rec: AuditRecommendation) => {
    setEditingId(rec.id);
    setForm({ title: rec.title, detail: rec.detail, chiffreAffaires: String(rec.chiffreAffaires || ''), venduPar: rec.venduPar || '' });
    setShowForm(true);
  };

  const handleSaveForm = async () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    const venduPar = form.venduPar || undefined;

    if (editingId) {
      const next = recommendations.map((r) =>
        r.id === editingId
          ? { ...r, title: form.title.trim(), detail: form.detail.trim(), chiffreAffaires: Number(form.chiffreAffaires) || 0, venduPar, updatedDate: now }
          : r
      );
      await persist(next);
    } else {
      const newRec: AuditRecommendation = {
        id: `rec_${Date.now()}`,
        title: form.title.trim(),
        detail: form.detail.trim(),
        chiffreAffaires: Number(form.chiffreAffaires) || 0,
        venduPar,
        status: 'proposee',
        createdDate: now,
      };
      await persist([newRec, ...recommendations]);
    }

    setShowForm(false);
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await persist(recommendations.filter((r) => r.id !== id));
  };

  const updateStatus = async (id: string, status: AuditRecommendationStatus, service?: AuditRecommendationService) => {
    const next = recommendations.map((r) =>
      r.id === id ? { ...r, status, ...(service ? { service } : {}), updatedDate: new Date().toISOString() } : r
    );
    await persist(next);
    setChoosingServiceFor(null);
  };

  const handleAccept = (id: string) => {
    setChoosingServiceFor(id);
  };

  const handleChooseService = (id: string, service: AuditRecommendationService) => {
    updateStatus(id, 'acceptee', service);
  };

  const totalsByStatus = recommendations.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + (r.chiffreAffaires || 0);
    return acc;
  }, {});
  const totalGeneral = recommendations
    .filter((r) => r.status !== 'refusee')
    .reduce((sum, r) => sum + (r.chiffreAffaires || 0), 0);

  const totalsByVendeur = recommendations
    .filter((r) => r.status !== 'refusee' && r.venduPar)
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.venduPar!] = (acc[r.venduPar!] || 0) + (r.chiffreAffaires || 0);
      return acc;
    }, {});

  return (
    <div className="space-y-6">
      {/* En-tête + résumé CA */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6" />
              Recommandations
            </h3>
            <p className="text-emerald-100 text-sm mt-1">Suivi des recommandations proposées au client et de leur mise en place</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-100 uppercase tracking-wide mb-1">CA potentiel (hors refusées)</p>
            <p className="text-3xl font-bold">{formatEuro(totalGeneral)}</p>
          </div>
        </div>
        {Object.keys(totalsByVendeur).length > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/20">
            {(Object.keys(VENDEUR_LABELS) as AuditRecommendationVendeur[])
              .filter((v) => totalsByVendeur[v])
              .map((v) => (
                <div key={v} className="text-sm">
                  <span className="text-emerald-100">{VENDEUR_LABELS[v]} : </span>
                  <span className="font-bold">{formatEuro(totalsByVendeur[v])}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Bouton nouvelle recommandation */}
      <button
        onClick={openNewForm}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Nouvelle recommandation
      </button>

      {/* Formulaire ajout/édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Modifier la recommandation' : 'Nouvelle recommandation'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex : Restructuration de la rémunération du gérant"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Détail</label>
                <textarea
                  value={form.detail}
                  onChange={(e) => setForm({ ...form, detail: e.target.value })}
                  rows={4}
                  placeholder="Contexte, justification, contenu de la recommandation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Chiffre d'affaires estimé (€)</label>
                <input
                  type="number"
                  value={form.chiffreAffaires}
                  onChange={(e) => setForm({ ...form, chiffreAffaires: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Affecté à</label>
                <select
                  value={form.venduPar}
                  onChange={(e) => setForm({ ...form, venduPar: e.target.value as AuditRecommendationVendeur | '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">— Non affecté —</option>
                  {(Object.keys(VENDEUR_LABELS) as AuditRecommendationVendeur[]).map((v) => (
                    <option key={v} value={v}>{VENDEUR_LABELS[v]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveForm}
                disabled={!form.title.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des recommandations */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-1">Aucune recommandation</h4>
          <p className="text-gray-600 text-sm">Ajoutez la première recommandation pour ce client</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id} className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900">{rec.title}</h4>
                  {rec.detail && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{rec.detail}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditForm(rec)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Modifier">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(rec.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap mt-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[rec.status]}`}>
                  {STATUS_LABELS[rec.status]}
                </span>
                {rec.service && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-300">
                    {SERVICE_LABELS[rec.service]}
                  </span>
                )}
                {rec.chiffreAffaires > 0 && (
                  <span className="text-sm font-semibold text-emerald-700">{formatEuro(rec.chiffreAffaires)}</span>
                )}
                {rec.venduPar && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {VENDEUR_LABELS[rec.venduPar]}
                  </span>
                )}
              </div>

              {/* Choix du service (après acceptation) */}
              {choosingServiceFor === rec.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Transmettre l'information au service :</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(SERVICE_LABELS) as AuditRecommendationService[]).map((svc) => (
                      <button
                        key={svc}
                        onClick={() => handleChooseService(rec.id, svc)}
                        className="px-3 py-1.5 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 text-sm font-medium"
                      >
                        {SERVICE_LABELS[svc]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions selon le statut */}
              {choosingServiceFor !== rec.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  {rec.status === 'proposee' && (
                    <>
                      <button
                        onClick={() => handleAccept(rec.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accepté par le client
                      </button>
                      <button
                        onClick={() => updateStatus(rec.id, 'refusee')}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Refusé
                      </button>
                    </>
                  )}
                  {rec.status === 'acceptee' && (
                    <button
                      onClick={() => updateStatus(rec.id, 'en_cours', rec.service)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Passer en cours
                    </button>
                  )}
                  {rec.status === 'en_cours' && (
                    <button
                      onClick={() => updateStatus(rec.id, 'acte_finalise', rec.service)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                      <FileCheck className="w-4 h-4" />
                      Acte finalisé et transmis au client
                    </button>
                  )}
                  {rec.status === 'acte_finalise' && (
                    <button
                      onClick={() => updateStatus(rec.id, 'termine', rec.service)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      <Flag className="w-4 h-4" />
                      Terminer
                    </button>
                  )}
                  {rec.status === 'refusee' && (
                    <button
                      onClick={() => updateStatus(rec.id, 'proposee')}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      Réactiver
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
