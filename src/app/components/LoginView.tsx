import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { apiBaseUrl } from '../utils/api/info';

interface LoginViewProps {
  onLogin: () => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Signup fields
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Erreur de connexion';
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      const token = result.access_token || result.session?.access_token;
      const user = result.user;

      if (token && user) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        toast.success('Connexion réussie !');
        onLogin();
      } else {
        setError('Réponse serveur invalide');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Sign in exception:', err);
      setError(err.message || 'Erreur de connexion');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || !nom || !prenom) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {

      const response = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          nom,
          prenom,
          specialite: 'Gestion de patrimoine',
          certifications: 'CIF, AMF',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur signup:', result);
        const errorMessage = result.error || 'Erreur de création de compte';
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      toast.success('Compte créé avec succès ! Bienvenue !');

      // Se connecter automatiquement
      await new Promise(resolve => setTimeout(resolve, 500));

      const signInResponse = await fetch(`${apiBaseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const signInResult = await signInResponse.json();

      if (!signInResponse.ok) {
        console.error('❌ Erreur signin automatique:', signInResult);
        setMode('signin');
        toast.info('Veuillez vous connecter avec vos identifiants');
        setPassword('');
        setLoading(false);
        return;
      }

      const token = signInResult.access_token || signInResult.session?.access_token;
      const user = signInResult.user;

      if (token && user) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        toast.success('Bienvenue !');
        onLogin();
      }
    } catch (err: any) {
      console.error('💥 Exception lors de la création:', err);
      const errorMessage = err.message || 'Erreur de connexion au serveur';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CRM CGP
          </h1>
          <p className="text-gray-600">
            Gestion de patrimoine et suivi client
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Toggle Sign In / Sign Up */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Créer un compte
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {mode === 'signin' ? 'Connexion Conseiller' : 'Nouveau Conseiller'}
          </h2>

          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-5">
            {/* Sign Up Fields */}
            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    id="prenom"
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Jean"
                  />
                </div>

                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    id="nom"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Dupont"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email professionnel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="conseiller@exemple.fr"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe {mode === 'signup' && '(min 6 caractères)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-semibold mb-1">❌ Erreur</p>
                <p>{error}</p>
                {error.includes('Invalid login credentials') && (
                  <p className="mt-2 text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-200">
                    💡 <strong>Conseil:</strong> Identifiants incorrects. Si vous n'avez pas de compte, cliquez sur "Créer un compte" ci-dessus.
                  </p>
                )}
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {mode === 'signin' ? 'Connexion...' : 'Création...'}
                </span>
              ) : (
                mode === 'signin' ? 'Se connecter' : 'Créer mon compte'
              )}
            </button>
          </form>

          {/* Lien mot de passe oublié */}
          {mode === 'signin' && (
            <div className="mt-6 text-center">
              <a
                href="#"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Contactez votre administrateur pour réinitialiser votre mot de passe');
                }}
              >
                Mot de passe oublié ?
              </a>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            {mode === 'signin' 
              ? 'Pas encore de compte ? Créez-en un ci-dessus !'
              : 'Créez votre compte conseiller pour accéder au CRM'}
          </p>
        </div>
      </div>
    </div>
  );
}
