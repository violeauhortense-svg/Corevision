import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  delay?: number; // ms de délai avant sauvegarde (default: 5000)
  onSave: () => Promise<boolean>;
  onError?: (error: Error) => void;
}

export function useAutoSave({
  delay = 5000,
  onSave,
  onError,
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);

  // Trigger auto-save avec debounce
  const triggerAutoSave = () => {
    setHasUnsavedChanges(true);
    setSaveStatus('idle');

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        const success = await onSave();
        if (success) {
          setSaveStatus('saved');
          setHasUnsavedChanges(false);
          // Garder "saved" pendant 2s, puis revenir à idle
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          toast.error('Erreur lors de la sauvegarde');
        }
      } catch (error) {
        setSaveStatus('error');
        const err = error instanceof Error ? error : new Error('Unknown error');
        onError?.(err);
        toast.error('Erreur lors de la sauvegarde');
      } finally {
        isSavingRef.current = false;
      }
    }, delay);
  };

  // Cleanup sur unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Avertir si l'utilisateur essaie de partir avec des changements non sauvegardés
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && saveStatus !== 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, saveStatus]);

  return {
    saveStatus,
    hasUnsavedChanges,
    triggerAutoSave,
  };
}
