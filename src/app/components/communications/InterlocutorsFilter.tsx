import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface InterlocutorsFilterProps {
  interlocutors: Array<{ email: string; name?: string; count: number }>;
  selected: string[];
  onSelectionChange: (emails: string[]) => void;
}

export function InterlocutorsFilter({
  interlocutors,
  selected,
  onSelectionChange,
}: InterlocutorsFilterProps) {
  const [showAll, setShowAll] = useState(false);

  const handleToggle = (email: string) => {
    if (selected.includes(email)) {
      onSelectionChange(selected.filter((e) => e !== email));
    } else {
      onSelectionChange([...selected, email]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  if (interlocutors.length === 0) {
    return null;
  }

  // Show max 5 by default, then "Show more"
  const displayCount = showAll ? interlocutors.length : Math.min(5, interlocutors.length);
  const displayedInterlocutors = interlocutors.slice(0, displayCount);
  const hiddenCount = interlocutors.length - displayCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          👤 Filtrer par Interlocuteur ({interlocutors.length})
        </h3>
        {selected.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearAll}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayedInterlocutors.map((interlocutor) => {
          const isSelected = selected.includes(interlocutor.email);
          const displayName = interlocutor.name
            ? interlocutor.name.split('@')[0]
            : interlocutor.email.split('@')[0];

          return (
            <button
              key={interlocutor.email}
              onClick={() => handleToggle(interlocutor.email)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={interlocutor.email}
            >
              <span>{displayName}</span>
              <span className={`text-xs font-semibold ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                {interlocutor.count}
              </span>
            </button>
          );
        })}

        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-200 transition-all border border-gray-200"
          >
            <span>+ {hiddenCount} autres</span>
          </button>
        )}

        {showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-200 transition-all border border-gray-200"
          >
            <span>Masquer</span>
          </button>
        )}
      </div>

      {/* Selected info */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-xs text-blue-900">
            <strong>{selected.length}</strong> interlocuteur{selected.length > 1 ? 's' : ''} sélectionné
            {selected.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-1 ml-auto">
            {selected.slice(0, 2).map((email) => (
              <Badge key={email} variant="secondary" className="text-xs max-w-[100px] truncate">
                {email.split('@')[0]}
              </Badge>
            ))}
            {selected.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{selected.length - 2}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
