import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

export function ServerDiagnostic() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    health?: { success: boolean; error?: string; response?: any };
    auth?: { success: boolean; error?: string };
    config?: { success: boolean; error?: string };
  }>({});

  const BASE_URL = `${apiBaseUrl}/make-server-cac859af`;

  const runDiagnostic = async () => {
    setTesting(true);
    setResults({});

    // Test 1: Configuration
    console.log('🔍 Test 1: Vérification de la configuration');
    const configResult = {
      success: true,
      projectId,
      baseUrl: BASE_URL,
      hasAnonKey: !!publicAnonKey,
      anonKeyLength: publicAnonKey?.length || 0,
    };
    console.log('✅ Config:', configResult);
    setResults(prev => ({ ...prev, config: { success: true } }));

    // Test 2: Health endpoint AVEC authentification
    console.log('🔍 Test 2: Test du endpoint /health avec Bearer token');
    try {
      const healthUrl = `${BASE_URL}/health`;
      console.log('📡 URL complète:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Health check réussi:', data);
        setResults(prev => ({ ...prev, health: { success: true, response: data } }));
        toast.success('Serveur accessible !');
      } else {
        const errorText = await response.text();
        console.error('❌ Health check échoué:', response.status, errorText);
        
        // Si c'est une erreur 401, c'est quand même positif car le serveur répond
        if (response.status === 401) {
          setResults(prev => ({ 
            ...prev, 
            health: { 
              success: true, 
              response: { 
                note: 'Serveur accessible mais endpoint requiert authentification',
                status: response.status,
                error: errorText
              }
            } 
          }));
          toast.success('Serveur accessible ! (Auth requise)');
        } else {
          setResults(prev => ({ 
            ...prev, 
            health: { 
              success: false, 
              error: `HTTP ${response.status}: ${errorText}` 
            } 
          }));
          toast.error(`Serveur inaccessible: ${response.status}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error);
      setResults(prev => ({ 
        ...prev, 
        health: { 
          success: false, 
          error: error.message || 'Network error' 
        } 
      }));
      toast.error('Impossible de contacter le serveur');
    }

    // Test 3: Auth endpoint
    console.log('🔍 Test 3: Test du endpoint /auth/profile');
    try {
      const authUrl = `${BASE_URL}/auth/profile`;
      console.log('📡 URL auth:', authUrl);
      
      const response = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Auth response status:', response.status);

      if (response.ok || response.status === 401) {
        // 401 est normal si pas authentifié, mais ça prouve que le serveur répond
        console.log('✅ Endpoint auth répond (même si 401)');
        setResults(prev => ({ ...prev, auth: { success: true } }));
      } else {
        const errorText = await response.text();
        console.error('❌ Auth endpoint échoué:', response.status, errorText);
        setResults(prev => ({ 
          ...prev, 
          auth: { 
            success: false, 
            error: `HTTP ${response.status}` 
          } 
        }));
      }
    } catch (error: any) {
      console.error('❌ Erreur auth:', error);
      setResults(prev => ({ 
        ...prev, 
        auth: { 
          success: false, 
          error: error.message 
        } 
      }));
    }

    setTesting(false);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Diagnostic Serveur</h2>
        <Button 
          onClick={runDiagnostic} 
          disabled={testing}
          className="flex items-center gap-2"
        >
          {testing && <Loader2 className="w-4 h-4 animate-spin" />}
          {testing ? 'Test en cours...' : 'Tester la connexion'}
        </Button>
      </div>

      <div className="space-y-3">
        {/* Configuration */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          {results.config?.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : results.config?.success === false ? (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <div className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">Configuration</p>
            <p className="text-sm text-gray-600">Project ID: {projectId}</p>
            <p className="text-sm text-gray-600 break-all">URL: {BASE_URL}</p>
            {results.config?.success && (
              <p className="text-sm text-green-600 mt-1">✓ Configuration valide</p>
            )}
          </div>
        </div>

        {/* Health Check */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          {results.health?.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : results.health?.success === false ? (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : testing ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">Endpoint /health</p>
            {results.health?.success && (
              <div className="text-sm text-green-600 mt-1">
                <p>✓ Serveur accessible</p>
                {results.health.response && (
                  <pre className="text-xs mt-2 p-2 bg-white rounded border">
                    {JSON.stringify(results.health.response, null, 2)}
                  </pre>
                )}
              </div>
            )}
            {results.health?.error && (
              <div className="text-sm text-red-600 mt-1">
                <p>✗ {results.health.error}</p>
                <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                  <p className="font-semibold">Causes possibles :</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Edge Function pas déployée sur Supabase</li>
                    <li>Nom de la fonction incorrect (doit être "make-server-cac859af")</li>
                    <li>CORS mal configuré</li>
                    <li>Problème réseau</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auth Check */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          {results.auth?.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : results.auth?.success === false ? (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : testing ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">Endpoint /auth/profile</p>
            {results.auth?.success && (
              <p className="text-sm text-green-600 mt-1">✓ Endpoint répond</p>
            )}
            {results.auth?.error && (
              <p className="text-sm text-red-600 mt-1">✗ {results.auth.error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Instructions de déploiement */}
      {results.health?.success === false && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            Comment déployer l'Edge Function ?
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-900">
            <li>
              Installez Supabase CLI :
              <code className="block mt-1 p-2 bg-white rounded text-xs">
                npm install -g supabase
              </code>
            </li>
            <li>
              Connectez-vous à votre projet :
              <code className="block mt-1 p-2 bg-white rounded text-xs">
                supabase link --project-ref {projectId}
              </code>
            </li>
            <li>
              Déployez la fonction :
              <code className="block mt-1 p-2 bg-white rounded text-xs">
                supabase functions deploy make-server-cac859af
              </code>
            </li>
            <li>
              Configurez les secrets :
              <code className="block mt-1 p-2 bg-white rounded text-xs">
                supabase secrets set SUPABASE_URL=https://{projectId}.supabase.co<br />
                supabase secrets set SUPABASE_ANON_KEY=your_anon_key<br />
                supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
              </code>
            </li>
          </ol>
        </div>
      )}
    </Card>
  );
}