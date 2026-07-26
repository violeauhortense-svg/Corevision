import { useState, useEffect } from 'react';
import { Play, Square, RefreshCw, Copy, CheckCircle2, AlertCircle, Terminal, Settings } from 'lucide-react';
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

interface BridgeStats {
  mails_synced: number;
  events_synced: number;
  emails_sent: number;
  meetings_responded: number;
  last_error?: string;
}

const BRIDGE_URL = "http://127.0.0.1:5001";

export function BridgeManager() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [bridgeStats, setBridgeStats] = useState<BridgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
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
        addLog(`✅ Bridge en ligne (${new Date().toLocaleTimeString()})`);
      } else {
        setBridgeStatus(null);
        addLog(`❌ Bridge hors ligne (${new Date().toLocaleTimeString()})`);
      }
    } catch (error) {
      setBridgeStatus(null);
      addLog(`❌ Impossible de se connecter au Bridge`);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), message]);
  };

  const handleSaveDeviceId = () => {
    localStorage.setItem('bridge_device_id', deviceId);
    toast.success(`Device ID sauvegardé: ${deviceId}`);
  };

  const handleForcedSync = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycles: ['mails', 'calendar', 'send', 'respond'] })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Synchronisation forcée lancée!');
        addLog(`🔄 Sync forcée: ${JSON.stringify(result.results)}`);
        checkBridgeStatus();
      } else {
        toast.error('Erreur lors de la synchronisation');
      }
    } catch (error) {
      toast.error('Impossible de lancer la synchronisation');
      addLog(`❌ Erreur sync: ${error}`);
    }
  };

  const copyInstruction = (instruction: string) => {
    navigator.clipboard.writeText(instruction);
    toast.success('Copié dans le presse-papiers!');
  };

  const instructions = [
    {
      title: "Windows (PowerShell)",
      steps: [
        "cd C:\\path\\to\\bridge",
        "pip install -r requirements.txt",
        "copy .env.example .env",
        "# Édite .env avec ton BACKEND_URL et DEVICE_ID",
        "python app.py"
      ]
    },
    {
      title: "Mac/Linux (Terminal)",
      steps: [
        "cd /path/to/bridge",
        "pip3 install -r requirements.txt",
        "cp .env.example .env",
        "# Édite .env avec ton BACKEND_URL et DEVICE_ID",
        "python3 app.py"
      ]
    }
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestionnaire Bridge Outlook</h1>
          </div>
          <p className="text-gray-600">Synchronise tes mails et calendrier Outlook avec Corevision</p>
        </div>

        {/* Status Card */}
        <Card className={`p-6 mb-8 border-l-4 ${bridgeStatus?.bridge_running ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {bridgeStatus?.bridge_running ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-bold text-green-900">Bridge EN LIGNE ✅</h2>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <h2 className="text-xl font-bold text-red-900">Bridge HORS LIGNE ❌</h2>
                  </>
                )}
              </div>

              {bridgeStatus?.bridge_running && (
                <div className="text-sm text-gray-700 space-y-1">
                  <p>🖥️ Device ID: <span className="font-mono font-bold">{bridgeStatus.device_id}</span></p>
                  <p>⏱️ Intervalle: <span className="font-mono">{bridgeStatus.sync_interval}s</span></p>
                  <p>🔄 Dernière sync: <span className="font-mono">{bridgeStatus.last_sync || 'En attente...'}</span></p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={checkBridgeStatus}
                className="p-3 hover:bg-gray-200 rounded-lg transition"
                title="Vérifier le statut"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>

              {bridgeStatus?.bridge_running && (
                <button
                  onClick={handleForcedSync}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Sync Maintenant
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Configuration */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold">Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device ID (identifie cet ordinateur)
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Sauvegarder
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Permet de synchroniser depuis plusieurs ordinateurs sans doublons
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>🌐 Backend URL:</strong> <span className="font-mono">https://corevision-api.onrender.com/make-server-cac859af</span>
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Cette URL est automatiquement utilisée par le Bridge
              </p>
            </div>
          </div>
        </Card>

        {/* Launch Instructions */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold">Lancer le Bridge</h3>
            </div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              {showInstructions ? 'Masquer' : 'Afficher'} Instructions
            </button>
          </div>

          {showInstructions && (
            <div className="space-y-6">
              {instructions.map((section, idx) => (
                <div key={idx} className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">{section.title}</h4>
                  <div className="space-y-2">
                    {section.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-start gap-3 bg-gray-900 p-3 rounded text-white text-sm">
                        <span className="text-gray-500 flex-shrink-0">$</span>
                        <div className="flex-1 flex items-center justify-between">
                          <code className="font-mono">{step}</code>
                          <button
                            onClick={() => copyInstruction(step)}
                            className="ml-2 p-1 hover:bg-gray-700 rounded transition"
                            title="Copier"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h5 className="font-semibold text-yellow-900 mb-2">⚠️ Points importants:</h5>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>✅ Python 3.8+ doit être installé</li>
                  <li>✅ Outlook doit être installé et configuré</li>
                  <li>✅ PowerShell 5.1+ sur Windows</li>
                  <li>✅ Le Bridge tourne sur http://127.0.0.1:5001</li>
                  <li>✅ Le Bridge se connecte à https://corevision-api.onrender.com</li>
                </ul>
              </div>
            </div>
          )}
        </Card>

        {/* Logs */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold">Logs</h3>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-48 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">En attente de logs...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Les logs sont mis à jour toutes les 5 secondes
          </p>
        </Card>

        {/* Multi-Device Support */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">🖥️ Utiliser le Bridge sur plusieurs ordinateurs</h3>
          <p className="text-sm text-blue-800 mb-3">
            Tu peux lancer le Bridge simultanément sur plusieurs ordinateurs! Chaque ordinateur aura son propre Device ID.
          </p>
          <div className="text-sm text-blue-800 space-y-2">
            <p>1. <strong>Copie le dossier `bridge/`</strong> sur chaque ordinateur</p>
            <p>2. <strong>Édite `.env`</strong> et mets un Device ID unique (ex: ordinateur-bureau, ordinateur-portable)</p>
            <p>3. <strong>Lance `python app.py`</strong> sur chaque ordinateur</p>
            <p>4. <strong>Zéro doublon!</strong> Les mails sont dédupliqués par Device ID</p>
          </div>
        </div>
      </div>
    </div>
  );
}
