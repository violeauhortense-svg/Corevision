import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ClientOption {
  id: string;
  name: string;
  email?: string;
  type: 'individual' | 'company';
}

interface ClientAssociationProps {
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  onAssociate: (clientId: string, clientName: string, clientEmail?: string) => Promise<void>;
  loading?: boolean;
}

export function ClientAssociation({
  clientId,
  clientName,
  clientEmail,
  onAssociate,
  loading = false,
}: ClientAssociationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<ClientOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAssociating, setIsAssociating] = useState(false);

  // Mock client list - TODO: Replace with API call
  const mockClients: ClientOption[] = [
    {
      id: 'client-123',
      name: 'Pierre Dubois (SARL Dubois)',
      email: 'pierre.dubois@co.fr',
      type: 'company',
    },
    {
      id: 'client-124',
      name: 'Marie Bernard (EURL Bernard)',
      email: 'marie.bernard@co.fr',
      type: 'company',
    },
    {
      id: 'client-125',
      name: 'Jean Legrand (Auto-entrepreneur)',
      email: 'jean.legrand@email.com',
      type: 'individual',
    },
    {
      id: 'client-126',
      name: 'Sophie Martin (Holding SCI)',
      email: 'sophie.martin@email.com',
      type: 'company',
    },
    {
      id: 'client-127',
      name: 'Olivier Rousseau (Consultant)',
      email: 'olivier.rousseau@business.com',
      type: 'individual',
    },
  ];

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = mockClients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleSelectClient = async (client: ClientOption) => {
    setIsAssociating(true);
    try {
      await onAssociate(client.id, client.name, client.email);
      setSearchTerm('');
      setSuggestions([]);
      setShowSuggestions(false);
      toast.success(`Client associé: ${client.name}`);
    } catch (error) {
      toast.error('Impossible d\'associer le client');
    } finally {
      setIsAssociating(false);
    }
  };

  const handleClearAssociation = async () => {
    setIsAssociating(true);
    try {
      await onAssociate('', '', undefined);
      toast.success('Association supprimée');
    } catch (error) {
      toast.error('Impossible de supprimer l\'association');
    } finally {
      setIsAssociating(false);
    }
  };

  // If already associated
  if (clientId && clientName) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">Client Associé</label>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-blue-900">{clientName}</p>
              {clientEmail && <p className="text-xs text-blue-700 mt-1">{clientEmail}</p>}
              <div className="flex items-center gap-2 mt-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700">Client trouvé et associé</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearAssociation}
              disabled={isAssociating || loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If not associated
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-900">Client Associé</label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tapez le nom du client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
            disabled={isAssociating || loading}
          />
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                disabled={isAssociating || loading}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors disabled:opacity-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                    {client.email && (
                      <p className="text-xs text-gray-500 mt-1">{client.email}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="flex-shrink-0 ml-2 text-xs"
                  >
                    {client.type === 'company' ? '🏢' : '👤'}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No suggestions */}
        {showSuggestions && suggestions.length === 0 && searchTerm.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            <p className="text-sm text-gray-600 text-center">Aucun client trouvé</p>
            <p className="text-xs text-gray-500 text-center mt-1">Vérifiez l\'orthographe ou l\'email</p>
          </div>
        )}
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500 mt-2">
        🔍 Commence à taper pour rechercher un client. Auto-détection disponible si email correspond.
      </p>
    </div>
  );
}
