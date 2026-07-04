import type { TabType } from './types';

interface Tab {
  id: TabType;
  label: string;
  group: 'parametres' | 'gestion';
}

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: Tab[] = [
  { id: 'foyer', label: 'Foyer', group: 'parametres' },
  { id: 'revenus', label: 'Revenus & Imposition', group: 'parametres' },
  { id: 'patrimoine', label: 'Patrimoine', group: 'parametres' },
  { id: 'objectifs', label: 'Objectifs', group: 'parametres' },
  { id: 'contacts', label: 'Contacts', group: 'parametres' },
  { id: 'taches', label: 'Tâches', group: 'gestion' },
  { id: 'documents', label: 'Documents', group: 'gestion' },
  { id: 'audit', label: 'Audit', group: 'gestion' },
  { id: 'historique', label: 'Historique', group: 'gestion' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const parametresTabs = TABS.filter(t => t.group === 'parametres');
  const gestionTabs = TABS.filter(t => t.group === 'gestion');

  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-4 p-2">
        {/* Groupe Paramètres Client */}
        <div className="flex gap-1 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          {parametresTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-700 hover:bg-blue-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Groupe Gestion */}
        <div className="flex gap-1 px-3 py-1 bg-gray-50 rounded-lg border border-gray-200">
          {gestionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}