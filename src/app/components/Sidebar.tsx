import { LayoutDashboard, Users, FileText, Calendar, CheckSquare, UserCircle, LogOut, Settings, Package, Lightbulb, Calculator, Mail } from 'lucide-react';
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
  
  const menuItems = [
    { id: 'dashboard' as ViewType, label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'clients' as ViewType, label: 'Clients', icon: Users },
    { id: 'mails' as ViewType, label: 'Hub Communication', icon: Mail },
    { id: 'agenda' as ViewType, label: 'Agenda', icon: Calendar },
    { id: 'todo' as ViewType, label: 'To Do List', icon: CheckSquare },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CoreVision</h1>
        <p className="text-sm text-gray-500 mt-1">Gestion de Patrimoine</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
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
            onClick={() => onViewChange('corevision')}
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
            onClick={() => onViewChange('knowledge-base')}
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
            onClick={() => onViewChange('baremes-fiscaux')}
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
          onClick={() => onViewChange('profile')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === 'profile'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'bg-blue-50 hover:bg-blue-100'
          }`}
        >
          <UserCircle className="w-5 h-5" />
          <div className="text-left flex-1">
            <p className={`text-sm font-medium ${
              currentView === 'profile' ? 'text-white' : 'text-blue-900'
            }`}>
              Mon profil
            </p>
            <p className={`text-xs ${
              currentView === 'profile' ? 'text-blue-100' : 'text-blue-700'
            }`}>
              {isAdmin ? 'Administrateur' : 'Conseiller CGP'}
            </p>
          </div>
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
