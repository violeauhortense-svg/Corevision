import { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router";
import { Toaster } from 'sonner';
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { ClientsView } from "./components/ClientsView";
import { AgendaView } from "./components/AgendaView";
import { TodoView } from "./components/TodoView";
import { RecommandationsGlobalView } from "./components/RecommandationsGlobalView";
import { UserManagementView } from "./components/UserManagementView";
import { LoginView } from "./components/LoginView";
import { ProfileView } from "./components/ProfileView";
import { CoreVisionAdminView } from "./components/CoreVisionAdminView";
import { AdminKnowledgeBase } from "./components/AdminKnowledgeBase";
import { BaremesFiscauxView } from "./components/BaremesFiscauxView";
import { HubCommunicationView } from "./components/communications/HubCommunicationViewUpdated";
import { BaremeUpdateNotification } from "./components/BaremeUpdateNotification";
import { cleanupObsoleteTasks } from './utils/cleanupObsoleteTasks';
import { clearAllTestData } from './utils/dataCleanup';
import { auditAndCleanupOrphanedData } from './utils/cleanupClientData';

export type ViewType =
  | "dashboard"
  | "clients"
  | "mails"
  | "agenda"
  | "todo"
  | "recommandations"
  | "profile"
  | "corevision"
  | "knowledge-base"
  | "baremes-fiscaux"
  | "user-management";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [openTasksTab, setOpenTasksTab] = useState(false);

  // Hub Communication, Agenda et To Do List sont réservés à l'administratrice
  // - même vérification que Sidebar.tsx (session EST l'objet utilisateur
  // {email, name, role}, pas un wrapper .user).
  const ADMIN_EMAIL = 'violeau.hortense@gmail.com';
  const isAdmin = session?.email === ADMIN_EMAIL;
  const ADMIN_ONLY_VIEWS: ViewType[] = ['mails', 'agenda', 'todo', 'user-management'];

  // Filet de sécurité si jamais currentView se retrouve sur une vue admin
  // alors que l'utilisateur ne l'est pas (état existant avant connexion,
  // etc.) - en plus du menu qui ne propose déjà plus ces entrées.
  useEffect(() => {
    if (!isAdmin && ADMIN_ONLY_VIEWS.includes(currentView)) {
      setCurrentView('dashboard');
    }
  }, [isAdmin, currentView]);

  // Détecter les routes publiques via query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = window.location.hash.includes('?') 
    ? new URLSearchParams(window.location.hash.split('?')[1])
    : new URLSearchParams();
  
  const page = urlParams.get('page') || hashParams.get('page');
  const token = urlParams.get('token') || hashParams.get('token');
  const isPublicRoute = page === 'core-vision' || page === 'knowledge-base';

  // 🗑️ NETTOYAGE DES DONNÉES DE TEST (une seule fois)
  useEffect(() => {
    const cleanupFlag = localStorage.getItem('test_data_cleanup_done');
    
    if (!cleanupFlag) {
      
      clearAllTestData();
      localStorage.setItem('test_data_cleanup_done', 'true');
      
    }
  }, []);

  // 🗑️ NETTOYAGE DES TÂCHES OBSOLÈTES (une seule fois)
  useEffect(() => {
    const cleanupFlag = localStorage.getItem('obsolete_tasks_cleanup_done');

    if (!cleanupFlag && isAuthenticated) {

      cleanupObsoleteTasks().then(() => {
        localStorage.setItem('obsolete_tasks_cleanup_done', 'true');
      }).catch((error) => {
        console.error('❌ Erreur lors du nettoyage des tâches obsolètes:', error);
      });
    }
  }, [isAuthenticated]);

  // 🧹 AUDIT ET NETTOYAGE DES DONNÉES ORPHELINES (une seule fois à l'authentification)
  useEffect(() => {
    if (isAuthenticated) {
      auditAndCleanupOrphanedData().then((result) => {
        if (result.success) {
        } else {
          console.warn('⚠️ Audit terminé avec des erreurs:', result.summary.errors);
        }
      }).catch((error) => {
        console.error('❌ Erreur lors de l\'audit des données orphelines:', error);
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setSession(user);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setIsAuthenticated(false);
    setSession(null);
  };

  // Si c'est une route publique, afficher directement
  if (isPublicRoute) {
    if (page === 'core-vision' && token) {
      return (
        <div>
          <Toaster position="top-right" richColors />
          <CoreVisionAdminView token={token} />
        </div>
      );
    }
    if (page === 'knowledge-base' && token) {
      return (
        <div>
          <Toaster position="top-right" richColors />
          <AdminKnowledgeBase token={token} />
        </div>
      );
    }
  }

  const renderView = () => {
    // Filet de sécurité supplémentaire (en plus du useEffect ci-dessus, qui
    // ne s'exécute qu'après le premier rendu) : ne jamais rendre une vue
    // admin-only pour un compte non-admin, même un instant.
    if (!isAdmin && ADMIN_ONLY_VIEWS.includes(currentView)) {
      return <DashboardView session={session} />;
    }

    switch (currentView) {
      case "dashboard":
        return <DashboardView session={session} />;
      case "clients":
        return <ClientsView session={session} selectedClientId={selectedClientId} openTasksTab={openTasksTab} />;
      case "mails":
        return <HubCommunicationView />;
      case "agenda":
        return <AgendaView session={session} />;
      case "todo":
        return <TodoView session={session} onNavigateToClient={(clientId) => {
          setCurrentView('clients');
          setSelectedClientId(clientId);
          setOpenTasksTab(true);
        }} />;
      case "recommandations":
        return <RecommandationsGlobalView onNavigateToClient={(clientId) => {
          setCurrentView('clients');
          setSelectedClientId(clientId);
        }} />;
      case "profile":
        return <ProfileView session={session} onLogout={handleLogout} />;
      case "corevision":
        return <CoreVisionAdminView session={session} />;
      case "knowledge-base":
        return <AdminKnowledgeBase session={session} />;
      case "baremes-fiscaux":
        return <BaremesFiscauxView />;
      case "user-management":
        return <UserManagementView />;
      default:
        return <DashboardView session={session} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={
          <>
            {!isAuthenticated ? (
              <LoginView 
                onLogin={() => setIsAuthenticated(true)}
              />
            ) : (
              <div className="flex h-screen bg-gray-50">
                <Toaster position="top-right" richColors />
                <BaremeUpdateNotification />
                <Sidebar
                  currentView={currentView}
                  session={session}
                  onViewChange={(view) => {
                    setCurrentView(view);
                    if (view !== 'clients') {
                      setSelectedClientId(null);
                      setOpenTasksTab(false);
                    }
                  }}
                  onLogout={handleLogout}
                />
                <main className="flex-1 overflow-y-auto overflow-x-hidden pt-14 md:pt-0">
                  {renderView()}
                </main>
              </div>
            )}
          </>
        } />
      </Routes>
    </HashRouter>
  );
}
