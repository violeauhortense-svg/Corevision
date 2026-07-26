import { useState, useEffect } from 'react';
import { Play, RefreshCw, CheckCircle2, AlertCircle, Terminal, Settings, Download } from 'lucide-react';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface BridgeStatus {
  status: 'ok' | 'error';
  bridge_running: boolean;
  backend_healthy?: boolean;
  device_id?: string;
  sync_interval?: number;
  last_sync?: string;
}

const BRIDGE_URL = "http://127.0.0.1:5001";

export function BridgeManager() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deviceId, setDeviceId] = useState(localStorage.getItem('bridge_device_id') || 'device-001');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    checkBridgeStatus();
    const interval = setInterval(checkBridgeStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkBridgeStatus = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setBridgeStatus(data);
        addLog(`✅ Bridge en ligne`);
      } else {
        setBridgeStatus(null);
        addLog(`❌ Bridge hors ligne`);
      }
    } catch (error) {
      setBridgeStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), message]);
  };

  const handleForcedSync = async () => {
    if (!bridgeStatus?.bridge_running) {
      toast.error('Bridge non disponible');
      return;
    }

    try {
      setSyncing(true);
      addLog('🔄 Synchronisation en cours...');

      const response = await fetch(`${BRIDGE_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycles: ['mails', 'calendar', 'send', 'respond'] })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('✅ Synchronisation terminée!');

        const mails = result.results.mails?.sent || 0;
        const events = result.results.calendar?.events_synced || 0;
        const emails = result.results.send?.emails_sent || 0;
        const responses = result.results.respond?.meetings_responded || 0;

        addLog(`✅ Sync réussie: ${mails} mails, ${events} calendriers, ${emails} emails, ${responses} réponses`);
        checkBridgeStatus();
      } else {
        toast.error('Erreur lors de la synchronisation');
        addLog(`❌ Erreur: ${response.statusText}`);
      }
    } catch (error) {
      toast.error('Impossible de synchroniser');
      addLog(`❌ Erreur: ${error}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveDeviceId = () => {
    localStorage.setItem('bridge_device_id', deviceId);
    toast.success(`Device ID: ${deviceId}`);
  };

  const downloadInstaller = () => {
    const link = document.createElement('a');
    link.href = '/bridge/install_service.bat';
    link.download = 'install_bridge_service.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement: install_bridge_service.bat');
  };

  const downloadLauncher = () => {
    const link = document.createElement('a');
    link.href = '/bridge/launcher.bat';
    link.download = 'bridge_launcher.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement: bridge_launcher.bat');
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bridge Outlook</h1>
          </div>
          <p className="text-gray-600">Synchronisation automatique Outlook ↔ Corevision</p>
        </div>

        {/* Status Card */}
        <Card className={`p-8 mb-8 border-l-4 text-center ${bridgeStatus?.bridge_running ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <div className="flex justify-center mb-4">
            {bridgeStatus?.bridge_running ? (
              <CheckCircle2 className="w-16 h-16 text-green-600 animate-pulse" />
            ) : (
              <AlertCircle className="w-16 h-16 text-red-600" />
            )}
          </div>

          <h2 className={`text-3xl font-bold mb-2 ${bridgeStatus?.bridge_running ? 'text-green-900' : 'text-red-900'}`}>
            {bridgeStatus?.bridge_running ? '🟢 BRIDGE EN LIGNE' : '🔴 BRIDGE HORS LIGNE'}
          </h2>

          <p className={`text-lg mb-6 ${bridgeStatus?.bridge_running ? 'text-green-700' : 'text-red-700'}`}>
            {bridgeStatus?.bridge_running
              ? 'Synchronisation en cours toutes les 30 secondes'
              : 'Installation requise - Clique ci-dessous'}
          </p>

          {bridgeStatus?.bridge_running && (
            <div className="grid grid-cols-2 gap-4 mb-6 text-left">
              <div className="bg-white/50 p-3 rounded">
                <p className="text-xs text-gray-600">Device ID</p>
                <p className="font-mono font-bold text-green-900">{bridgeStatus.device_id}</p>
              </div>
              <div className="bg-white/50 p-3 rounded">
                <p className="text-xs text-gray-600">Dernière sync</p>
                <p className="font-mono text-green-900">{bridgeStatus.last_sync || 'Bientôt...'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            {bridgeStatus?.bridge_running ? (
              <>
                <button
                  onClick={handleForcedSync}
                  disabled={syncing}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold text-lg flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  {syncing ? 'Synchronisation...' : 'Synchroniser Maintenant'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={downloadInstaller}
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-lg flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Installer le Bridge
                </button>
                <button
                  onClick={checkBridgeStatus}
                  className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Vérifier
                </button>
              </>
            )}
          </div>
        </Card>

        {/* Setup Instructions */}
        {!bridgeStatus?.bridge_running && (
          <div className="space-y-4 mb-8">
            {/* Option 1: Service Windows */}
            <Card className="p-6 bg-blue-50 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                ⚙️ Option 1: Service Windows (Recommandé avec droits admin)
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p>Démarrage automatique au boot, tourne 24/7 en arrière-plan</p>
                <div className="bg-white p-3 rounded space-y-2">
                  <p><strong>Étape 1:</strong> Clique sur le bouton ci-dessus</p>
                  <p><strong>Étape 2:</strong> Clique droit sur le fichier → "Exécuter en tant qu'administrateur"</p>
                  <p><strong>Étape 3:</strong> Attends 2-3 min (l'installateur configure tout)</p>
                  <p><strong>Étape 4:</strong> Reviens ici et clique "Synchroniser Maintenant"</p>
                </div>
              </div>
              <button
                onClick={downloadInstaller}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
              >
                ⬇️ Télécharger installateur service
              </button>
            </Card>

            {/* Option 2: Launcher GUI */}
            <Card className="p-6 bg-green-50 border border-green-200">
              <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                ✨ Option 2: Launcher GUI (Sans droits admin)
              </h3>
              <div className="space-y-3 text-sm text-green-800">
                <p>Interface graphique, pas besoin de droits admin, démarrage manuel</p>
                <div className="bg-white p-3 rounded space-y-2">
                  <p><strong>Étape 1:</strong> Clique sur le bouton ci-dessous</p>
                  <p><strong>Étape 2:</strong> Double-clique sur le fichier téléchargé</p>
                  <p><strong>Étape 3:</strong> Clique "Démarrer Bridge" dans la fenêtre</p>
                  <p><strong>Étape 4:</strong> Reviens ici et clique "Synchroniser Maintenant"</p>
                </div>
              </div>
              <button
                onClick={downloadLauncher}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
              >
                ⬇️ Télécharger launcher (sans admin)
              </button>
            </Card>
          </div>
        )}

        {/* Configuration */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold">Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device ID (ce cet ordinateur)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="Ex: mon-ordinateur-001"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveDeviceId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                >
                  Sauvegarder
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Permet de synchroniser depuis plusieurs ordinateurs sans doublons
              </p>
            </div>
          </div>
        </Card>

        {/* Logs */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold">Logs</h3>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-32 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">En attente de connexion au Bridge...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
