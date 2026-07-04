import { useState } from 'react';
import { Eye, Download, Trash2, X, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface EmailVisualizationProps {
  emailData: any;
  onDelete?: () => void;
}

export function EmailVisualization({ emailData, onDelete }: EmailVisualizationProps) {
  const [showModal, setShowModal] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Boutons d'action */}
      <button
        onClick={() => setShowModal(true)}
        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
        title="Visualiser l'email"
      >
        <Eye className="w-5 h-5" />
      </button>

      <button
        onClick={handlePrint}
        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
        title="Imprimer/Télécharger"
      >
        <Download className="w-5 h-5" />
      </button>

      {onDelete && (
        <button
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet email ?')) {
              onDelete();
              toast.success('Email supprimé');
            }
          }}
          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}

      {/* Modal de visualisation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">📧 Copie de l'email envoyé</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  {emailData.clientName}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-3xl mx-auto">
                <div className="text-center pb-6 border-b border-gray-200 mb-6">
                  <Mail className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900">Copie de l'email envoyé</h3>
                  <p className="text-gray-600 mt-2">
                    Envoyé le {new Date(emailData.sentAt).toLocaleDateString('fr-FR')} à {new Date(emailData.sentAt).toLocaleTimeString('fr-FR')}
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  {/* En-tête de l'email */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">De :</span>
                      <span className="text-gray-900">{emailData.sentBy} &lt;{emailData.sentFrom}&gt;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">À :</span>
                      <span className="text-gray-900">{emailData.clientName} &lt;{emailData.sentTo}&gt;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Objet :</span>
                      <span className="text-gray-900 font-semibold">{emailData.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Date :</span>
                      <span className="text-gray-900">{new Date(emailData.sentAt).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Corps de l'email */}
                  <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-4">
                    <p className="text-gray-900">Bonjour {emailData.clientName},</p>
                    
                    <p className="text-gray-900">{emailData.intro}</p>
                    
                    <p className="text-gray-900 whitespace-pre-wrap">{emailData.body}</p>
                    
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 my-6">
                      <p className="text-indigo-900 font-medium mb-3 text-center">
                        📝 Lien de signature envoyé au client
                      </p>
                      <div className="bg-white rounded p-2 text-xs text-gray-600 break-all text-center">
                        {emailData.signatureUrl}
                      </div>
                    </div>
                    
                    <p className="text-gray-900">{emailData.closing}</p>
                    
                    <div className="border-t pt-4 mt-4">
                      <p className="text-gray-900">Bien cordialement,</p>
                      <p className="text-gray-900 font-semibold">{emailData.sentBy}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-900">
                      ✅ <strong>Email envoyé avec succès</strong><br />
                      <span className="text-xs text-green-700">Ce document constitue une preuve de l'envoi du compte rendu au client</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Télécharger</span>
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
