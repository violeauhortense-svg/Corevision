import { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MailNote } from '../../types/mail';

interface NotesSystemProps {
  notes: MailNote[];
  onAddNote: (content: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  loading?: boolean;
}

export function NotesSystem({ notes, onAddNote, onDeleteNote, loading = false }: NotesSystemProps) {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('La note ne peut pas être vide');
      return;
    }

    setIsAdding(true);
    try {
      await onAddNote(newNote);
      setNewNote('');
      toast.success('Note ajoutée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
      toast.error('Impossible d\'ajouter la note');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note?')) {
      return;
    }

    try {
      await onDeleteNote(noteId);
      toast.success('Note supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
      toast.error('Impossible de supprimer la note');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm">📝 Notes ({notes.length})</h3>

      {/* Affichage des notes existantes */}
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-900">{note.createdByName || note.createdBy}</p>
                  <p className="text-gray-500 mt-0.5">{formatDate(note.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  disabled={loading || isAdding}
                  className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                  title="Supprimer cette note"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ajouter une note */}
      <div className="space-y-2">
        <Textarea
          placeholder="Ajoutez votre note ici..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={4}
          className="resize-none text-sm"
          disabled={loading || isAdding}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {newNote.length} caractères • Appuyez sur Enter + Shift pour nouvelle ligne
          </p>
          <Button
            onClick={handleAddNote}
            disabled={loading || isAdding || !newNote.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            {isAdding ? 'Ajout...' : 'Ajouter note'}
          </Button>
        </div>
      </div>

      {/* Info */}
      {notes.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Aucune note pour le moment</p>
          <p className="text-xs text-gray-400 mt-1">Vos notes s\'afficheront ici</p>
        </div>
      )}
    </div>
  );
}
