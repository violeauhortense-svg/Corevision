import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, CheckCircle, Circle, ListTodo, AlertCircle, Plus, MapPin, Building2, Home, Video, X, XCircle } from 'lucide-react';
import { taskSyncService } from '../services/taskSyncService';
import { taskAPI } from '../services/api';
import type { Task } from '../types/client';
import type { AgendaEvent, MeetingType } from '../types/agenda';
import { agendaAPI } from '../services/agendaAPI';
import { clientAPI } from '../services/api';
import { toast } from 'sonner';

interface AgendaViewProps {
  session: any;
}

type LocationType = 'cabinet' | 'client' | 'visio';

export function AgendaView({ session }: AgendaViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<AgendaEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  
  // États du formulaire de RDV
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clients, setClients] = useState<any[]>([]);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [locationType, setLocationType] = useState<LocationType>('cabinet');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('R1');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [cabinetInfo, setCabinetInfo] = useState<any>(null);

  // Charger les infos cabinet
  useEffect(() => {
    const loadCabinetInfo = () => {
      const userProfile = localStorage.getItem('user_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        setCabinetInfo(profile);
        if (profile.companyAddress) {
          setMeetingLocation(`${profile.companyAddress}, ${profile.companyPostalCode} ${profile.companyCity}`);
        }
      }
    };
    loadCabinetInfo();
  }, []);

  // Charger les tâches avec deadline et les RDV
  useEffect(() => {
    loadAgendaData();
  }, [session]);

  const loadAgendaData = async () => {
    try {
      // Charger les tâches avec deadline depuis tous les clients
      const allClients = await clientAPI.getAll();
      setClients(allClients);

      const tasksWithDeadline: Task[] = [];
      for (const client of allClients) {
        try {
          const clientTasks = await taskAPI.getByClientId(client.id);
          const filtered = clientTasks.filter(task =>
            task.deadline && task.deadline.trim() !== '' && !task.completed
          );
          tasksWithDeadline.push(...filtered);
        } catch (error) {
          console.warn(`⚠️ Erreur chargement tâches client ${client.id}:`, error);
        }
      }

      setTasks(tasksWithDeadline);

      // Charger tous les RDV
      const allMeetings = await agendaAPI.getAll();
      setMeetings(allMeetings);
    } catch (error) {
      console.error('❌ Erreur chargement agenda:', error);
      toast.error('Erreur lors du chargement de l\'agenda');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.clientId) {
      try {
        const success = await taskSyncService.completeTask(
          task.clientId,
          taskId,
          localStorage.getItem('user_id') || 'default'
        );
        if (success) {
          await loadAgendaData();
          toast.success('✅ Tâche marquée comme complétée');
        }
      } catch (error) {
        console.error('Erreur completion tâche:', error);
        toast.error('❌ Erreur lors de la completion de la tâche');
      }
    }
  };

  const toggleMeeting = async (meetingId: string) => {
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) return;

      await agendaAPI.update(meetingId, { completed: !meeting.completed });
      toast.success(meeting.completed ? 'RDV réactivé' : 'RDV complété');
      await loadAgendaData();
    } catch (error) {
      console.error('Erreur mise à jour RDV:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleCreateMeeting = async () => {
    if (!selectedClient || !meetingDate) {
      toast.error('Veuillez sélectionner un client et une date');
      return;
    }

    try {
      const client = clients.find(c => c.id === selectedClient);
      if (!client) return;

      const meetingDateTime = `${meetingDate}T${meetingTime}:00`;

      await agendaAPI.create({
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        title: `RDV ${meetingType} - ${client.name}`,
        date: meetingDateTime,
        time: meetingTime,
        location: meetingLocation,
        locationType: locationType,
        meetingType: meetingType,
        description: meetingDescription || `Rendez-vous ${meetingType} avec ${client.name}`,
        completed: false,
      });

      toast.success('📅 Rendez-vous créé avec succès');
      setShowCreateMeeting(false);
      
      // Réinitialiser le formulaire
      setSelectedClient('');
      setMeetingDate('');
      setMeetingTime('14:00');
      setMeetingDescription('');
      setMeetingType('R1');
      
      await loadAgendaData();
    } catch (error) {
      console.error('Erreur création RDV:', error);
      toast.error('Erreur lors de la création du RDV');
    }
  };

  // Mettre à jour l'adresse selon le type de lieu
  useEffect(() => {
    if (locationType === 'cabinet' && cabinetInfo?.companyAddress) {
      setMeetingLocation(`${cabinetInfo.companyAddress}, ${cabinetInfo.companyPostalCode} ${cabinetInfo.companyCity}`);
    } else if (locationType === 'client') {
      const client = clients.find(c => c.id === selectedClient);
      if (client?.address) {
        setMeetingLocation(`${client.address}${client.postalCode || client.city ? ', ' + (client.postalCode || '') + ' ' + (client.city || '') : ''}`);
      } else {
        setMeetingLocation('Chez le client (adresse à compléter)');
      }
    } else if (locationType === 'visio') {
      setMeetingLocation('Rendez-vous en visioconférence');
    }
  }, [locationType, cabinetInfo, selectedClient, clients]);

  // Filtrer les tâches par date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.deadline === dateStr);
  };

  // Filtrer les RDV par date
  const getMeetingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return meetings.filter(meeting => meeting.date.startsWith(dateStr));
  };

  const getTodayItems = () => {
    const today = new Date();
    return {
      tasks: getTasksForDate(today),
      meetings: getMeetingsForDate(today),
    };
  };

  const getUpcomingItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingTasks = tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate > today;
    });

    const upcomingMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      meetingDate.setHours(0, 0, 0, 0);
      return meetingDate > today;
    });

    return { tasks: upcomingTasks, meetings: upcomingMeetings };
  };

  const getOverdueItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueTasks = tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today && !task.completed;
    });

    const overdueMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      meetingDate.setHours(0, 0, 0, 0);
      return meetingDate < today && !meeting.completed;
    });

    return { tasks: overdueTasks, meetings: overdueMeetings };
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const hasItemsOnDate = (date: Date | null) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return tasks.some(task => task.deadline === dateStr) || meetings.some(meeting => meeting.date.startsWith(dateStr));
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'cabinet': return <Building2 className="w-4 h-4" />;
      case 'client': return <Home className="w-4 h-4" />;
      case 'visio': return <Video className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'R1': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'R2': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'suivi': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const todayItems = getTodayItems();
  const upcomingItems = getUpcomingItems();
  const overdueItems = getOverdueItems();
  const totalTasks = tasks.length;
  const totalMeetings = meetings.length;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">Agenda</h2>
          <p className="text-gray-600 mt-2">Planification de vos tâches et rendez-vous</p>
        </div>
        <button
          onClick={() => setShowCreateMeeting(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Créer un RDV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Aujourd'hui</p>
          <p className="text-3xl font-semibold text-blue-600 mt-2">{todayItems.tasks.length + todayItems.meetings.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">À venir</p>
          <p className="text-3xl font-semibold text-green-600 mt-2">{upcomingItems.tasks.length + upcomingItems.meetings.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">En retard</p>
          <p className="text-3xl font-semibold text-red-600 mt-2">{overdueItems.tasks.length + overdueItems.meetings.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Tâches</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{totalTasks}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">RDV</p>
          <p className="text-3xl font-semibold text-indigo-600 mt-2">{totalMeetings}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square"></div>;
                }
                
                const today = isToday(date);
                const hasItems = hasItemsOnDate(date);
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors relative ${
                      today
                        ? 'bg-blue-600 text-white font-semibold'
                        : hasItems
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                    {hasItems && !today && (
                      <div className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          {/* En retard */}
          {(overdueItems.tasks.length > 0 || overdueItems.meetings.length > 0) && (
            <div className="bg-white rounded-lg border border-red-200 p-6">
              <h3 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                En retard ({overdueItems.tasks.length + overdueItems.meetings.length})
              </h3>
              <div className="space-y-3">
                {/* Tâches en retard */}
                {overdueItems.tasks.map((task) => (
                  <div key={task.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="mt-1 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ListTodo className="w-4 h-4 text-red-600" />
                          <span className="text-xs font-semibold text-red-700 uppercase">Tâche</span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        {task.clientName && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <User className="w-4 h-4" />
                            <span>{task.clientName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>Échéance: {new Date(task.deadline!).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* RDV en retard */}
                {overdueItems.meetings.map((meeting) => (
                  <div key={meeting.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleMeeting(meeting.id)}
                        className="mt-1 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-red-600" />
                          <span className="text-xs font-semibold text-red-700 uppercase">RDV</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getMeetingTypeColor(meeting.meetingType)}`}>
                            {meeting.meetingType}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                        <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(meeting.date).toLocaleDateString('fr-FR')} à {meeting.time}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          {getLocationIcon(meeting.locationType)}
                          <span>{meeting.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aujourd'hui */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Aujourd'hui - {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <div className="space-y-3">
              {todayItems.tasks.length === 0 && todayItems.meetings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Rien de prévu aujourd'hui</p>
                </div>
              ) : (
                <>
                  {/* Tâches d'aujourd'hui */}
                  {todayItems.tasks.map((task) => (
                    <div key={task.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`mt-1 transition-colors ${
                            task.completed ? 'text-green-600' : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          {task.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <ListTodo className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700 uppercase">Tâche</span>
                          </div>
                          <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                          {task.clientName && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                              <User className="w-4 h-4" />
                              <span>{task.clientName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* RDV d'aujourd'hui */}
                  {todayItems.meetings.map((meeting) => (
                    <div key={meeting.id} className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleMeeting(meeting.id)}
                          className={`mt-1 transition-colors ${
                            meeting.completed ? 'text-green-600' : 'text-indigo-600 hover:text-indigo-800'
                          }`}
                        >
                          {meeting.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-semibold text-indigo-700 uppercase">RDV</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getMeetingTypeColor(meeting.meetingType)}`}>
                              {meeting.meetingType}
                            </span>
                          </div>
                          <h4 className={`font-semibold ${meeting.completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                            {meeting.title}
                          </h4>
                          <div className="flex items-center gap-1 text-sm text-gray-700 mt-1">
                            <Clock className="w-4 h-4" />
                            <span>{meeting.time}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            {getLocationIcon(meeting.locationType)}
                            <span>{meeting.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* À venir */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">À venir</h3>
            <div className="space-y-3">
              {upcomingItems.tasks.length === 0 && upcomingItems.meetings.length === 0 ? (
                <div className="text-center py-8">
                  <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Rien de prévu prochainement</p>
                </div>
              ) : (
                <>
                  {/* Tâches à venir - Limiter à 5 */}
                  {upcomingItems.tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`mt-1 transition-colors ${
                            task.completed ? 'text-green-600' : 'text-gray-400 hover:text-blue-600'
                          }`}
                        >
                          {task.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <ListTodo className="w-4 h-4 text-gray-600" />
                            <span className="text-xs font-semibold text-gray-700 uppercase">Tâche</span>
                          </div>
                          <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                            {task.clientName && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{task.clientName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(task.deadline!).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* RDV à venir - Limiter à 5 */}
                  {upcomingItems.meetings.slice(0, 5).map((meeting) => (
                    <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleMeeting(meeting.id)}
                          className={`mt-1 transition-colors ${
                            meeting.completed ? 'text-green-600' : 'text-gray-400 hover:text-indigo-600'
                          }`}
                        >
                          {meeting.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-xs font-semibold text-gray-700 uppercase">RDV</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getMeetingTypeColor(meeting.meetingType)}`}>
                              {meeting.meetingType}
                            </span>
                          </div>
                          <h4 className={`font-semibold ${meeting.completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                            {meeting.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{meeting.clientName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(meeting.date).toLocaleDateString('fr-FR')} à {meeting.time}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            {getLocationIcon(meeting.locationType)}
                            <span>{meeting.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création de RDV */}
      {showCreateMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-2xl font-bold text-gray-900">Créer un rendez-vous</h3>
              <button
                onClick={() => setShowCreateMeeting(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Client *
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type de RDV */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Type de rendez-vous
                </label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="R1">R1 - Premier rendez-vous</option>
                  <option value="R2">R2 - Présentation des préconisations</option>
                  <option value="suivi">Suivi</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Date et heure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Heure *
                  </label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Type de lieu */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Lieu du rendez-vous
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setLocationType('cabinet')}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                      locationType === 'cabinet'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className={`w-6 h-6 ${locationType === 'cabinet' ? 'text-indigo-600' : 'text-gray-600'}`} />
                    <span className={`text-sm font-medium ${locationType === 'cabinet' ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Cabinet
                    </span>
                  </button>
                  <button
                    onClick={() => setLocationType('client')}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                      locationType === 'client'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Home className={`w-6 h-6 ${locationType === 'client' ? 'text-indigo-600' : 'text-gray-600'}`} />
                    <span className={`text-sm font-medium ${locationType === 'client' ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Domicile
                    </span>
                  </button>
                  <button
                    onClick={() => setLocationType('visio')}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                      locationType === 'visio'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video className={`w-6 h-6 ${locationType === 'visio' ? 'text-indigo-600' : 'text-gray-600'}`} />
                    <span className={`text-sm font-medium ${locationType === 'visio' ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Visio
                    </span>
                  </button>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Adresse
                </label>
                <textarea
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Adresse du rendez-vous"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  value={meetingDescription}
                  onChange={(e) => setMeetingDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Notes sur le rendez-vous..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowCreateMeeting(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateMeeting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Créer le RDV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
