import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { migrateLocalStorageToBackend, needsMigration } from '../services/migrationService';

export function MigrationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    // Vérifier si la migration est nécessaire
    const checkMigration = async () => {
      const needs = await needsMigration();
      setShowBanner(needs);
    };

    checkMigration();
  }, []);

  const handleMigrate = async () => {
    setMigrating(true);
    toast.info('🔄 Migration en cours...');

    try {
      const result = await migrateLocalStorageToBackend();

      if (result.success) {
        toast.success(`✅ Migration réussie : ${result.migratedCount} client(s) migré(s)`);
        setMigrationDone(true);
        setTimeout(() => {
          setShowBanner(false);
        }, 3000);
      } else {
        toast.error(`❌ Migration échouée : ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Erreur migration:', error);
      toast.error('❌ Erreur lors de la migration');
    } finally {
      setMigrating(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {migrationDone ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            {migrationDone ? 'Migration terminée !' : 'Migration des données requise'}
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            {migrationDone ? (
              <p>Vos clients ont été migrés avec succès vers le backend.</p>
            ) : (
              <p>
                Des clients sont stockés localement. Pour pouvoir générer des rapports patrimoniaux,
                vous devez migrer ces données vers le backend sécurisé.
              </p>
            )}
          </div>
          {!migrationDone && (
            <div className="mt-4">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`-ml-1 mr-2 h-4 w-4 ${migrating ? 'animate-spin' : ''}`} />
                {migrating ? 'Migration en cours...' : 'Migrer maintenant'}
              </button>
            </div>
          )}
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setShowBanner(false)}
            className="inline-flex rounded-md bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50"
          >
            <span className="sr-only">Fermer</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
