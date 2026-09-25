import { useEffect, useState } from 'react';
import { Users, UserPlus, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { apiBaseUrl } from '../utils/api/info';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  created: string;
}

const ADMIN_EMAIL = 'violeau.hortense@gmail.com';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function UserManagementView() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/users`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        toast.error(data.error || 'Erreur lors du chargement des comptes');
      }
    } catch (err) {
      console.error('❌ Erreur chargement utilisateurs:', err);
      toast.error('Erreur lors du chargement des comptes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.prenom || !form.nom) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: `${form.prenom} ${form.nom}`.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Erreur lors de la création du compte');
        return;
      }

      toast.success(`Compte créé pour ${form.email}`);
      setForm({ prenom: '', nom: '', email: '', password: '' });
      loadUsers();
    } catch (err) {
      console.error('❌ Erreur création utilisateur:', err);
      toast.error('Erreur lors de la création du compte');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7" />
          Gestion des utilisateurs
        </h1>
        <p className="text-indigo-100 text-sm mt-1">
          La création de compte en libre-service est désactivée - seule l'administratrice
          peut créer un nouveau compte, depuis cette page.
        </p>
      </div>

      {/* Créer un compte */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          Créer un compte
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input
              type="text"
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="conseiller@efipatrimoine.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe (min. 6 caractères)</label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
            >
              {creating ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>

      {/* Comptes existants */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Comptes existants ({users.length})</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Aucun compte trouvé</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{u.name || u.email}</p>
                  <p className="text-sm text-gray-500 truncate">{u.email}</p>
                </div>
                {u.email === ADMIN_EMAIL && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
