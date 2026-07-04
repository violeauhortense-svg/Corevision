import { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Edit, X, Save, Building2 } from 'lucide-react';
import { agendaAPI } from '../../services/agendaAPI';
import type { ClientData } from './types';

interface ClientHeaderProps {
  clientData: ClientData;
  onBack: () => void;
  onUpdate: (updates: Partial<ClientData>) => void;
}

export function ClientHeader({
  clientData,
  onBack,
  onUpdate,
}: ClientHeaderProps) {
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [tempClientData, setTempClientData] = useState(clientData);

  // Charger automatiquement les dates RDV depuis l'agenda
  useEffect(() => {
    const loadMeetingDates = async () => {
      try {
        const agendaEvents = agendaAPI.getAll();
        const clientEvents = agendaEvents.filter((event: any) => event.clientId === clientData.id);

        if (clientEvents.length === 0) return;

        const now = new Date();
        const pastEvents = clientEvents.filter((event: any) => new Date(`${event.date}T${event.time}`) < now);
        const futureEvents = clientEvents.filter((event: any) => new Date(`${event.date}T${event.time}`) >= now);

        // Trouver le RDV passé le plus récent
        const lastMeeting = pastEvents.length > 0
          ? pastEvents.sort((a: any, b: any) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())[0]
          : null;

        // Trouver le RDV futur le plus proche
        const nextMeeting = futureEvents.length > 0
          ? futureEvents.sort((a: any, b: any) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0]
          : null;

        // Mettre à jour automatiquement si les dates ont changé
        const updates: Partial<ClientData> = {};
        if (lastMeeting && clientData.lastMeetingDate !== lastMeeting.date) {
          updates.lastMeetingDate = lastMeeting.date;
        }
        if (nextMeeting && clientData.nextMeetingDate !== nextMeeting.date) {
          updates.nextMeetingDate = nextMeeting.date;
        }

        if (Object.keys(updates).length > 0) {
          onUpdate(updates);
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors du chargement des dates RDV:', error);
      }
    };

    loadMeetingDates();
  }, [clientData.id, onUpdate]);

  const startEditClient = () => {
    setTempClientData(clientData);
    setIsEditingClient(true);
  };

  const saveClientEdit = () => {
    onUpdate({ ...tempClientData, name: `${tempClientData.firstName} ${tempClientData.lastName}` });
    setIsEditingClient(false);
  };

  const cancelClientEdit = () => {
    setTempClientData(clientData);
    setIsEditingClient(false);
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour à la liste</span>
        </button>
        
        {/* Bandeau principal */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h2 className="text-3xl font-semibold text-gray-900">{clientData.firstName} <span className="text-gray-700">{clientData.lastName}</span></h2>
                <p className="text-sm text-gray-500 mt-1">{clientData.phone && `📱 ${clientData.phone}`}</p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{clientData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{clientData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{clientData.address}</span>
                  </div>
                  {clientData.birthDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Né(e) le {new Date(clientData.birthDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {clientData.mainCompany && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>{clientData.mainCompany}</span>
                    </div>
                  )}
                  {clientData.lastMeetingDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Dernier RDV: {new Date(clientData.lastMeetingDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {clientData.nextMeetingDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Prochain RDV: {new Date(clientData.nextMeetingDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Statut</p>
              <span className="inline-flex mt-2 px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                {clientData.status}
              </span>
              
              <button
                onClick={startEditClient}
                className="flex items-center gap-2 mt-3 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition client */}
      {isEditingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-gray-900">Modifier les informations client</h3>
              <button
                onClick={cancelClientEdit}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={tempClientData.firstName}
                    onChange={(e) => setTempClientData({ ...tempClientData, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={tempClientData.lastName}
                    onChange={(e) => setTempClientData({ ...tempClientData, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={tempClientData.email}
                    onChange={(e) => setTempClientData({ ...tempClientData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={tempClientData.phone}
                    onChange={(e) => setTempClientData({ ...tempClientData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={tempClientData.address}
                    onChange={(e) => setTempClientData({ ...tempClientData, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={tempClientData.birthDate}
                    onChange={(e) => setTempClientData({ ...tempClientData, birthDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Société principale</label>
                  <input
                    type="text"
                    value={tempClientData.mainCompany || ''}
                    onChange={(e) => setTempClientData({ ...tempClientData, mainCompany: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Nom de la société"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date du dernier RDV</label>
                  <input
                    type="date"
                    value={tempClientData.lastMeetingDate || ''}
                    onChange={(e) => setTempClientData({ ...tempClientData, lastMeetingDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date du prochain RDV</label>
                  <input
                    type="date"
                    value={tempClientData.nextMeetingDate || ''}
                    onChange={(e) => setTempClientData({ ...tempClientData, nextMeetingDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Majoration fiscale */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Fiscalité</h4>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={tempClientData.majorationPartFiscale || false}
                    onChange={(e) => setTempClientData({ ...tempClientData, majorationPartFiscale: e.target.checked })}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-green-600">+ 0,5 part fiscale (majoration)</span>
                    <p className="text-xs text-gray-500 mt-0.5">Invalidité, ancien combattant, etc.</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveClientEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>Enregistrer</span>
                </button>
                <button
                  onClick={cancelClientEdit}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}