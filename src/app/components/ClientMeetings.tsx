import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Building2, Home, Video, CheckCircle, XCircle } from 'lucide-react';
import { agendaAPI } from '../services/agendaAPI';
import type { AgendaEvent } from '../types/agenda';

interface ClientMeetingsProps {
  clientId: string;
}

export function ClientMeetings({ clientId }: ClientMeetingsProps) {
  const [meetings, setMeetings] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, [clientId]);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const clientMeetings = await agendaAPI.getByClientId(clientId);
      
      // Trier par date (plus récent en premier)
      clientMeetings.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setMeetings(clientMeetings);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'cabinet':
        return <Building2 className="w-4 h-4" />;
      case 'client':
        return <Home className="w-4 h-4" />;
      case 'visio':
        return <Video className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'R1':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'R2':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'suivi':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const toggleMeetingCompleted = async (meetingId: string, completed: boolean) => {
    try {
      await agendaAPI.update(meetingId, { completed: !completed });
      await loadMeetings();
    } catch (error) {
      console.error('Erreur mise à jour RDV:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Aucun rendez-vous planifié</p>
        <p className="text-gray-500 text-xs mt-1">
          Les rendez-vous apparaîtront ici après l'envoi d'un email de confirmation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => {
        const meetingDate = new Date(meeting.date);
        const isPast = meetingDate < new Date();
        
        return (
          <div
            key={meeting.id}
            className={`border-2 rounded-xl p-4 transition-all ${
              meeting.completed
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                : isPast && !meeting.completed
                ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300'
                : 'bg-white border-gray-200 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox pour marquer comme complété */}
              <button
                onClick={() => toggleMeetingCompleted(meeting.id, meeting.completed || false)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  meeting.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}
              >
                {meeting.completed && <CheckCircle className="w-4 h-4 text-white" />}
              </button>

              <div className="flex-1">
                {/* En-tête avec titre et badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className={`font-semibold text-base ${
                    meeting.completed ? 'text-green-800 line-through' : 'text-gray-900'
                  }`}>
                    {meeting.title}
                  </h4>
                  
                  <div className="flex items-center gap-2">
                    {/* Badge type de RDV */}
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border-2 ${getMeetingTypeColor(meeting.meetingType)}`}>
                      {meeting.meetingType.toUpperCase()}
                    </span>
                    
                    {/* Badge complété */}
                    {meeting.completed && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium border border-green-300">
                        <CheckCircle className="w-3 h-3" />
                        Terminé
                      </span>
                    )}
                    
                    {/* Badge en retard */}
                    {isPast && !meeting.completed && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium border border-orange-300">
                        <XCircle className="w-3 h-3" />
                        En retard
                      </span>
                    )}
                  </div>
                </div>

                {/* Infos du RDV */}
                <div className="space-y-2">
                  {/* Date et heure */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">
                      {meetingDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <Clock className="w-4 h-4 text-indigo-600 ml-2" />
                    <span className="font-medium">{meeting.time}</span>
                  </div>

                  {/* Lieu */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {getLocationIcon(meeting.locationType)}
                    <span>{meeting.location}</span>
                  </div>

                  {/* Description */}
                  {meeting.description && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {meeting.description}
                    </p>
                  )}

                  {/* Notes */}
                  {meeting.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <strong>Notes :</strong> {meeting.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
