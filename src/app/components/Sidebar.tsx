import { useState } from 'react';
import { LayoutDashboard, Users, FileText, Calendar, CheckSquare, LogOut, Settings, Package, Lightbulb, Calculator, Mail, Terminal, Menu, X } from 'lucide-react';
import type { ViewType } from '../App';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  session?: any; // Ajouter session pour vérifier l'admin
}

export function Sidebar({ currentView, onViewChange, onLogout, session }: SidebarProps) {
  // Vérifier si l'utilisateur est admin
  const ADMIN_EMAIL = 'violeau.hortense@gmail.com';
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  // En dessous du breakpoint md, la sidebar est un tiroir hors-écran ouvert
  // via ce hamburger, plutôt qu'une colonne fixe de 256px qui ne laissait
  // presque plus de place au contenu sur un écran de téléphone.
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (view: ViewType) => {
    onViewChange(view);
    setMobileOpen(false);
  };

  const menuItems = [
    { id: 'dashboard' as ViewType, label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'clients' as ViewType, label: 'Clients', icon: Users },
    { id: 'mails' as ViewType, label: 'Hub Communication', icon: Mail },
    { id: 'agenda' as ViewType, label: 'Agenda', icon: Calendar },
    { id: 'todo' as ViewType, label: 'To Do List', icon: CheckSquare },
  ];

  return (
    <>
      {/* Hamburger mobile - masqué sur desktop (md:hidden) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Fond assombri derrière le tiroir mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="p-6 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EFI-Patrimoine</h1>
          <p className="text-sm text-gray-500 mt-1">CRM - Gestion Client</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200 space-y-2">
        {/* Bouton CoreVision - Visible uniquement pour l'admin */}
        {isAdmin && (
          <button
            onClick={() => navigate('corevision')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'corevision'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 border border-purple-200'
            }`}
          >
            <Package className="w-5 h-5" />
            <div className="text-left flex-1">
              <p className={`text-sm font-semibold ${
                currentView === 'corevision' ? 'text-white' : 'text-purple-900'
              }`}>
                Commandes CoreVision
              </p>
              <p className={`text-xs ${
                currentView === 'corevision' ? 'text-purple-100' : 'text-purple-600'
              }`}>
                Administration
              </p>
            </div>
          </button>
        )}
        
        {/* Bouton Knowledge Base - Visible uniquement pour l'admin */}
        {isAdmin && (
          <button
            onClick={() => navigate('knowledge-base')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'knowledge-base'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200'
            }`}
          >
            <Lightbulb className="w-5 h-5" />
            <div className="text-left flex-1">
              <p className={`text-sm font-semibold ${
                currentView === 'knowledge-base' ? 'text-white' : 'text-indigo-900'
              }`}>
                Base de Connaissances
              </p>
              <p className={`text-xs ${
                currentView === 'knowledge-base' ? 'text-indigo-100' : 'text-indigo-600'
              }`}>
                Ingestion IA
              </p>
            </div>
          </button>
        )}

        {/* Bouton Barèmes Fiscaux - Visible uniquement pour l'admin */}
        {isAdmin && (
          <button
            onClick={() => navigate('baremes-fiscaux')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'baremes-fiscaux'
                ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-green-50 to-teal-50 text-green-700 hover:from-green-100 hover:to-teal-100 border border-green-200'
            }`}
          >
            <Calculator className="w-5 h-5" />
            <div className="text-left flex-1">
              <p className={`text-sm font-semibold ${
                currentView === 'baremes-fiscaux' ? 'text-white' : 'text-green-900'
              }`}>
                Barèmes Fiscaux
              </p>
              <p className={`text-xs ${
                currentView === 'baremes-fiscaux' ? 'text-green-100' : 'text-green-600'
              }`}>
                IR, IFI, PS
              </p>
            </div>
          </button>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
      </aside>
    </>
  );
}
