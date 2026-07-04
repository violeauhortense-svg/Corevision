import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, UserPlus } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        
        // Message d'erreur plus explicite
        let errorMessage = 'Erreur de connexion';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = '❌ Identifiants incorrects. Vérifiez votre email et mot de passe.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = '📧 Veuillez confirmer votre email avant de vous connecter.';
        } else if (error.message.includes('network')) {
          errorMessage = '🌐 Erreur réseau. Vérifiez votre connexion internet.';
        } else {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      toast.success('Connexion réussie !');
      onLogin();
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
      console.log('🚀 Tentative de création de compte avec Supabase Auth...');
      console.log('📧 Email:', email);
      console.log('👤 Nom:', nom, prenom);
      
      // Créer le compte directement avec Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom,
            prenom,
            specialite: 'Gestion de patrimoine',
            certifications: 'CIF, AMF',
          },
        },
      });

      if (signUpError) {
        console.error('❌ Erreur Supabase signUp:', signUpError);
        setError(signUpError.message);
        toast.error(signUpError.message);
        setLoading(false);
        return;
      }

      console.log('✅ Compte créé avec succès !', signUpData);

      // Vérifier si l'email doit être confirmé
      if (signUpData.user && !signUpData.session) {
        toast.info('Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail.');
        setMode('signin');
        setPassword('');
        setNom('');
        setPrenom('');
        setLoading(false);
        return;
      }

      // Si la session est créée automatiquement (email_confirm désactivé)
      if (signUpData.session) {
        console.log('✅ Session créée automatiquement !');
        toast.success('Compte créé avec succès ! Bienvenue !');
        onLogin();
        return;
      }

      // Sinon, connexion manuelle
      toast.success('Compte créé ! Connexion en cours...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Erreur lors de la connexion automatique:', signInError);
        setMode('signin');
        toast.info('Veuillez vous connecter avec vos identifiants');
        setPassword('');
        setNom('');
        setPrenom('');
        setLoading(false);
        return;
      }

      console.log('✅ Connexion automatique réussie !');
      toast.success('Bienvenue !');
      onLogin();
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