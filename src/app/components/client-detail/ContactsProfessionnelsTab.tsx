import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Users, Mail, Phone, Building, FileText, Link } from 'lucide-react';
import { toast } from 'sonner';
import { addTimestamps } from '../../utils/traceability';
import type { ContactProfessionnel } from './types';

interface ContactsProfessionnelsTabProps {
  contacts: ContactProfessionnel[];
  onUpdateContacts: (contacts: ContactProfessionnel[]) => void;
}

export function ContactsProfessionnelsTab({ contacts, onUpdateContacts }: ContactsProfessionnelsTabProps) {
  const [localContacts, setLocalContacts] = useState<ContactProfessionnel[]>(contacts);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);

  // 🔥 Synchroniser les contacts avec les props quand elles changent
  useEffect(() => {
    setLocalContacts(contacts);
  }, [contacts]);

  const fonctionsDisponibles = [
    { value: 'expert-comptable', label: '💼 Expert-comptable' },
    { value: 'notaire', label: '⚖️ Notaire' },
    { value: 'avocat', label: '🎓 Avocat / Juridique' },
    { value: 'conseil-social', label: '🏥 Conseil social' },
    { value: 'autre', label: '📋 Autre' },
  ];

  const addContact = () => {
    const newContact: ContactProfessionnel = {
      id: `contact-${Date.now()}`,
      nom: '',
      prenom: '',
      fonction: 'expert-comptable',
      structure: '',
      email: '',
      telephone: '',
      dateSaisie: new Date().toISOString(),
    };
    setLocalContacts([...localContacts, newContact]);
    setEditingContact(newContact.id);
    setIsEditing(true);
  };

  const removeContact = (id: string) => {
    setLocalContacts(localContacts.filter((c) => c.id !== id));
    toast.success('Contact supprimé');
  };

  const updateContact = (id: string, updates: Partial<ContactProfessionnel>) => {
    setLocalContacts(
      localContacts.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const saveContacts = () => {
    // Validation des contacts avant sauvegarde
    const invalidContacts = localContacts.filter(
      (c) => !c.nom || !c.prenom || !c.structure || (!c.email && !c.telephone)
    );

    if (invalidContacts.length > 0) {
      toast.error('Veuillez remplir tous les champs obligatoires (nom, prénom, structure, email ou téléphone)');
      return;
    }

    // 🕒 Ajouter automatiquement les timestamps de traçabilité
    const contactsWithTimestamps = localContacts.map(contact => {
      const isNew = !contact.dateSaisie;
      return addTimestamps(contact, isNew);
    });

    onUpdateContacts(contactsWithTimestamps);
    setIsEditing(false);
    setEditingContact(null);
    toast.success('Contacts professionnels mis à jour');
  };

  const cancelEdit = () => {
    setLocalContacts(contacts);
    setIsEditing(false);
    setEditingContact(null);
  };

  const getFonctionLabel = (fonction: string) => {
    const found = fonctionsDisponibles.find((f) => f.value === fonction);
    return found ? found.label : fonction;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non renseignée';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Contacts professionnels</h3>
            <p className="text-sm text-gray-500">
              Écosystème du client ({localContacts.length} contact{localContacts.length > 1 ? 's' : ''})
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={addContact}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un contact
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button
              onClick={saveContacts}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        )}
      </div>

      {/* Liste des contacts */}
      {localContacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Aucun contact professionnel</p>
          <p className="text-sm text-gray-500 mb-4">
            Ajoutez les professionnels qui accompagnent votre client
          </p>
          <button
            onClick={addContact}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter le premier contact
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {localContacts.map((contact) => (
            <div
              key={contact.id}
              className={`bg-white border rounded-lg p-5 transition-all ${
                editingContact === contact.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isEditing && editingContact === contact.id ? (
                /* Mode édition */
                <div className="space-y-3">
                  {/* Fonction */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fonction *
                    </label>
                    <select
                      value={contact.fonction}
                      onChange={(e) =>
                        updateContact(contact.id, {
                          fonction: e.target.value as ContactProfessionnel['fonction'],
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {fonctionsDisponibles.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fonction autre */}
                  {contact.fonction === 'autre' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Préciser la fonction
                      </label>
                      <input
                        type="text"
                        value={contact.fonctionAutre || ''}
                        onChange={(e) =>
                          updateContact(contact.id, { fonctionAutre: e.target.value })
                        }
                        placeholder="Ex: Courtier en assurance"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Nom et Prénom */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={contact.nom}
                        onChange={(e) => updateContact(contact.id, { nom: e.target.value })}
                        placeholder="Nom"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={contact.prenom}
                        onChange={(e) => updateContact(contact.id, { prenom: e.target.value })}
                        placeholder="Prénom"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Structure */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Structure / Cabinet *
                    </label>
                    <input
                      type="text"
                      value={contact.structure}
                      onChange={(e) => updateContact(contact.id, { structure: e.target.value })}
                      placeholder="Nom du cabinet ou de la structure"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Email et Téléphone */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact(contact.id, { email: e.target.value })}
                        placeholder="email@exemple.fr"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={contact.telephone}
                        onChange={(e) =>
                          updateContact(contact.id, { telephone: e.target.value })
                        }
                        placeholder="06 12 34 56 78"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={contact.notes || ''}
                      onChange={(e) => updateContact(contact.id, { notes: e.target.value })}
                      placeholder="Informations complémentaires..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Bouton supprimer */}
                  <button
                    onClick={() => removeContact(contact.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer ce contact
                  </button>
                </div>
              ) : (
                /* Mode affichage */
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">
                        {contact.fonction === 'autre' && contact.fonctionAutre
                          ? contact.fonctionAutre
                          : getFonctionLabel(contact.fonction)}
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {contact.prenom} {contact.nom}
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        setEditingContact(contact.id);
                        setIsEditing(true);
                      }}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Structure */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{contact.structure}</span>
                  </div>

                  {/* Coordonnées */}
                  <div className="space-y-1">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.telephone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a
                          href={`tel:${contact.telephone}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {contact.telephone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {contact.notes && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 italic">{contact.notes}</p>
                    </div>
                  )}

                  {/* 📅 TRAÇABILITÉ */}
                  {(contact.dateCreation || contact.dateModification || contact.dateSaisie) && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-400">
                        {contact.dateCreation && `✏️ Créé le ${formatDate(contact.dateCreation)}`}
                        {contact.dateModification && ` • 🔄 Modifié le ${formatDate(contact.dateModification)}`}
                        {!contact.dateCreation && !contact.dateModification && contact.dateSaisie && `💾 ${formatDate(contact.dateSaisie)}`}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info complémentaire */}
      {localContacts.length > 0 && !isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Coordination de l'écosystème
              </h4>
              <p className="text-xs text-blue-700">
                Ces contacts sont exploitables pour coordonner les actions et optimiser le suivi client.
                Les liens avec les objectifs, actifs et documents seront disponibles prochainement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
