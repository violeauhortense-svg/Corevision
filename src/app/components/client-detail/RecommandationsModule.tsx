import { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Pencil, CheckCircle2, XCircle, ArrowRight, ArrowLeft, FileCheck, Flag, Lightbulb, AlertTriangle, Paperclip, Eye, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AuditRecommendation, AuditRecommendationStatus, AuditRecommendationService, AuditRecommendationVendeur } from './types';
import {
  getRecommendationDocuments,
  uploadRecommendationDocument,
  deleteRecommendationDocument,
  recommendationDocumentUrl,
  type RecommendationDocument,
} from '../../services/recommendationDocumentsService';

interface RecommandationsModuleProps {
  clientId: string;
  recommendations: AuditRecommendation[];
  onUpdate: (recommendations: AuditRecommendation[]) => Promise<boolean | undefined> | Promise<void> | void;
}

// Exportées pour être réutilisées par la vue globale "Recommandations"
// (toutes clients confondus, src/app/components/RecommandationsGlobalView.tsx).
export const STATUS_LABELS: Record<AuditRecommendationStatus, string> = {
  proposee: '📝 Proposée',
  refusee: '❌ Refusée',
  acceptee: '✅ Acceptée',
  en_cours: '🔧 En cours',
  acte_finalise: '📄 Acte finalisé et transmis au client',
  termine: '🏁 Terminée',
};

// Précision affichée en plus petit sous le statut "Acceptée" - le client a
// donné son accord mais le règlement n'a pas encore été perçu.
export const STATUS_SUBLABELS: Partial<Record<AuditRecommendationStatus, string>> = {
  acceptee: 'en attente de règlement',
};

export const STATUS_COLORS: Record<AuditRecommendationStatus, string> = {
  proposee: 'bg-gray-100 text-gray-700 border-gray-300',
  refusee: 'bg-red-100 text-red-700 border-red-300',
  acceptee: 'bg-blue-100 text-blue-700 border-blue-300',
  en_cours: 'bg-amber-100 text-amber-700 border-amber-300',
  acte_finalise: 'bg-purple-100 text-purple-700 border-purple-300',
  termine: 'bg-green-100 text-green-700 border-green-300',
};

// Étape précédente pour chaque statut - permet de rattraper un clic sur
// le mauvais bouton/la mauvaise recommandation sans repartir de zéro.
const PREVIOUS_STATUS: Partial<Record<AuditRecommendationStatus, AuditRecommendationStatus>> = {
  acceptee: 'proposee',
  en_cours: 'acceptee',
  acte_finalise: 'en_cours',
  termine: 'acte_finalise',
};

export const SERVICE_LABELS: Record<AuditRecommendationService, string> = {
  juridique: '⚖️ Service juridique',
  investissement: '📈 Investissement',
  ingenierie_patrimoniale: '🏛️ Ingénierie patrimoniale',
};

export const VENDEUR_LABELS: Record<AuditRecommendationVendeur, string> = {
  moi: '👤 Hortense Violeau',
  lecler: '👤 M. Lecler',
  service_juridique: '⚖️ Service juridique',
  service_investissement: '📈 Service investissement',
  service_ingenierie_patrimoniale: '🏛️ Service ingénierie patrimoniale',
};

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

function emptyForm() {
  return { title: '', detail: '', chiffreAffaires: '', venduPar: '' as AuditRecommendationVendeur | '' };
}

export function RecommandationsModule({ clientId, recommendations, onUpdate }: RecommandationsModuleProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [choosingServiceFor, setChoosingServiceFor] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // PDF attachés par recommandation - chargés une fois pour toutes les
  // recommandations affichées (généralement peu nombreuses par client).
  const [docsByRec, setDocsByRec] = useState<Record<string, RecommendationDocument[]>>({});
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        recommendations.map(async (r) => [r.id, await getRecommendationDocuments(r.id)] as const)
      );
      if (!cancelled) setDocsByRec(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [recommendations.map((r) => r.id).join(',')]);

  const handleUploadFile = async (recId: string, file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (10 Mo max)');
      return;
    }
    setUploadingFor(recId);
    try {
      const created = await uploadRecommendationDocument(recId, clientId, file);
      setDocsByRec((prev) => ({ ...prev, [recId]: [created, ...(prev[recId] || [])] }));
      toast.success('Document ajouté');
    } catch (err) {
      console.error('Erreur upload document recommandation:', err);
      toast.error("Impossible d'envoyer le document");
    } finally {
      setUploadingFor(null);
    }
  };

  // Un <a href> classique navigue directement vers l'URL ngrok et tombe
  // sur sa page d'avertissement interstitielle (seul fetch() passe
  // l'en-tête qui la contourne, patché globalement dans utils/api/info -
  // une navigation de document brute ne le traverse pas). On récupère
  // donc le PDF via fetch() et on l'ouvre/télécharge depuis un blob local.
  const handleViewDocument = async (docId: string) => {
    // Ouvrir la fenêtre tout de suite, de façon synchrone dans le
    // gestionnaire de clic : Safari/iOS bloque window.open() si elle
    // intervient après un await, car ce n'est alors plus perçu comme
    // déclenché directement par le geste de l'utilisateur.
    const win = window.open('', '_blank');
    try {
      const response = await fetch(recommendationDocumentUrl(docId));
      if (!response.ok) throw new Error('fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (win) win.location.href = blobUrl;
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error('Erreur ouverture document:', err);
      win?.close();
      toast.error("Impossible d'ouvrir le document");
    }
  };

  const handleDownloadDocument = async (docId: string, filename: string) => {
    try {
      const response = await fetch(recommendationDocumentUrl(docId, { download: true }));
      if (!response.ok) throw new Error('fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Erreur téléchargement document:', err);
      toast.error('Impossible de télécharger le document');
    }
  };

  const handleDeleteDocument = async (recId: string, docId: string) => {
    const ok = await deleteRecommendationDocument(docId);
    if (ok) {
      setDocsByRec((prev) => ({ ...prev, [recId]: (prev[recId] || []).filter((d) => d.id !== docId) }));
      toast.success('Document supprimé');
    } else {
      toast.error('Impossible de supprimer le document');
    }
  };

  // Renvoie true/false plutôt que rien, pour permettre aux appelants de ne
  // pas fermer/vider un formulaire (et perdre la saisie) quand la
  // sauvegarde échoue réellement côté serveur.
  const persist = async (next: AuditRecommendation[]): Promise<boolean> => {
    const result = await onUpdate(next);
    return result !== false;
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

    let ok: boolean;
    if (editingId) {
      const next = recommendations.map((r) =>
        r.id === editingId
          ? { ...r, title: form.title.trim(), detail: form.detail.trim(), chiffreAffaires: Number(form.chiffreAffaires) || 0, venduPar, updatedDate: now }
          : r
      );
      ok = await persist(next);
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
      ok = await persist([newRec, ...recommendations]);
    }

    // En cas d'échec réel de la sauvegarde (persistState affiche déjà son
    // propre message d'erreur), on garde le formulaire ouvert avec la
    // saisie intacte plutôt que de la perdre et forcer à tout retaper.
    if (!ok) return;

    setShowForm(false);
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await persist(recommendations.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
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
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Vendu par</label>
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

      {/* Confirmation de suppression */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0 bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Supprimer cette recommandation ?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {recommendations.find((r) => r.id === confirmDeleteId)?.title
                    ? `« ${recommendations.find((r) => r.id === confirmDeleteId)?.title} » sera définitivement supprimée. Cette action est irréversible.`
                    : 'Cette action est irréversible.'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Supprimer
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
                  <button onClick={() => setConfirmDeleteId(rec.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap mt-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[rec.status]} ${STATUS_SUBLABELS[rec.status] ? 'flex flex-col items-start leading-tight py-1' : ''}`}>
                  <span>{STATUS_LABELS[rec.status]}</span>
                  {STATUS_SUBLABELS[rec.status] && (
                    <span className="text-[10px] font-normal opacity-75">{STATUS_SUBLABELS[rec.status]}</span>
                  )}
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

              {/* Documents PDF attachés */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  {(docsByRec[rec.id] || []).map((doc) => (
                    <span
                      key={doc.id}
                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      <Paperclip className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[160px]" title={doc.filename}>{doc.filename}</span>
                      <button
                        onClick={() => handleViewDocument(doc.id)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                        title="Voir"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc.id, doc.filename)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(rec.id, doc.id)}
                        className="p-1 hover:bg-red-100 rounded-full text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}

                  <input
                    ref={(el) => { fileInputs.current[rec.id] = el; }}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadFile(rec.id, file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputs.current[rec.id]?.click()}
                    disabled={uploadingFor === rec.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploadingFor === rec.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5" />
                    )}
                    Joindre un PDF
                  </button>
                </div>
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
                      <span className="flex flex-col items-start leading-tight">
                        <span>Passer en cours</span>
                        <span className="text-[10px] font-normal text-amber-100">en attente de règlement</span>
                      </span>
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
                  {PREVIOUS_STATUS[rec.status] && (
                    <button
                      onClick={() => updateStatus(rec.id, PREVIOUS_STATUS[rec.status]!)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium"
                      title={`Revenir à "${STATUS_LABELS[PREVIOUS_STATUS[rec.status]!]}"`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Étape précédente
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
