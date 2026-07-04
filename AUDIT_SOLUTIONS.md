# Solutions pour fixer le Modal Email de Confirmation de RDV

**Audit terminé** | **Problème identifié** | **3 solutions proposées**

---

## Résumé du problème

✅ Le bouton "Envoyer l'email de confirmation de RDV" existe  
✅ Le callback `onSendEmail` est défini  
❌ **Le modal ne s'affiche jamais** car il n'est jamais rendu

**Fichier problématique**: `src/app/components/client-detail/TaskTabNew.tsx`

---

## 3 Solutions proposées

### Solution 1 : Créer un nouveau composant modal (⭐ Recommandé)

**Avantage**: Architecture propre, réutilisable, maintenable  
**Temps**: 1-2 heures

**Fichier à créer**: `src/app/components/EmailConfirmationModal.tsx`

```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Mail, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '../types/client';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  task: Task | null;
  clientId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EmailConfirmationModal({
  isOpen,
  task,
  clientId,
  onClose,
  onSuccess,
}: EmailConfirmationModalProps) {
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [clientEmail, setClientEmail] = useState('');

  const handleSendEmail = async () => {
    if (!clientEmail.trim()) {
      toast.error('Veuillez saisir l\'email du client');
      return;
    }

    try {
      setIsSending(true);

      // TODO: Appeler le backend pour envoyer l'email
      // const response = await emailAPI.sendConfirmationEmail({
      //   clientId,
      //   to: clientEmail,
      //   subject: 'Confirmation de votre rendez-vous',
      //   htmlContent: emailContent || '<p>Confirmation de votre rendez-vous...</p>',
      // });

      console.log('📧 Email de confirmation envoyé à:', clientEmail);
      toast.success('Email de confirmation envoyé avec succès');

      // Mise à jour de la tâche pour enregistrer l'envoi
      // await taskAPI.update(task.id, {
      //   ...task,
      //   emailHistory: [
      //     ...(task.emailHistory || []),
      //     {
      //       id: crypto.randomUUID(),
      //       recipient: clientEmail,
      //       sentAt: new Date().toISOString(),
      //       status: 'sent',
      //     }
      //   ]
      // });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Envoyer l'email de confirmation de RDV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email du client */}
          <div>
            <Label htmlFor="clientEmail" className="text-sm font-medium">
              Email du client
            </Label>
            <input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contenu de l'email */}
          <div>
            <Label htmlFor="emailContent" className="text-sm font-medium">
              Contenu de l'email
            </Label>
            <Textarea
              id="emailContent"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Saisissez le contenu de l'email de confirmation..."
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Laissez vide pour utiliser le template par défaut
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Un email de confirmation sera envoyé au client avec tous les détails du rendez-vous.
            </p>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSending || !clientEmail.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Envoi...' : 'Envoyer l\'email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Puis dans TaskTabNew.tsx** (avant ligne 587) :

```typescript
      {/* Modal d'email de confirmation de RDV */}
      <EmailConfirmationModal
        isOpen={showEmailModal}
        task={selectedTaskForEmail}
        clientId={clientId}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedTaskForEmail(null);
        }}
        onSuccess={() => {
          setShowEmailModal(false);
          setSelectedTaskForEmail(null);
          loadTasks(); // Recharger pour voir la mise à jour
        }}
      />
    </div>
  );
}
```

---

### Solution 2 : Utiliser un composant modal existant

**Avantage**: Plus rapide, réutilise du code existant  
**Temps**: 30 minutes - 1 heure

Adapter le composant `MailTemplateModal.tsx` ou `NewConversationModal.tsx` pour l'envoi d'email.

```typescript
import { EmailConfirmationModal } from './mails/EmailConfirmationModal'; // À adapter/créer

// Dans TaskTabNew.tsx
<EmailConfirmationModal
  isOpen={showEmailModal}
  task={selectedTaskForEmail}
  onClose={() => setShowEmailModal(false)}
/>
```

---

### Solution 3 : Implémentation minimaliste (Rapidement, mais moins flexible)

**Avantage**: Le plus rapide à implémenter  
**Temps**: 15-30 minutes

Directement dans TaskTabNew.tsx, utiliser la librairie `dialog` existante :

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

// Dans le return, avant </div> final:
{showEmailModal && selectedTaskForEmail && (
  <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Envoyer l'email de confirmation de RDV</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email du client"
          className="w-full px-3 py-2 border rounded"
        />
        <textarea
          placeholder="Contenu de l'email"
          className="w-full px-3 py-2 border rounded min-h-[150px]"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowEmailModal(false)}
            className="px-4 py-2 border rounded"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              toast.success('Email envoyé');
              setShowEmailModal(false);
              loadTasks();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Envoyer
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)}
```

---

## Déplacement de la tâche entre stages

### Actuellement
La tâche `MeetingConfirmationTask` se trouve dans le stage :
- **"RDV découverte - finalisation de remplissage des infos et objectifs clients"**

### À déplacer vers
- **"Contacter le client / planifier le premier rendez-vous"**

### Comment faire

Modifier le template de stage dans les fichiers :
- `src/app/hooks/useTaskTemplates.ts`
- Ou le fichier de configuration des stages

**Chercher la définition du stage** et déplacer la tâche de confirmation d'email au bon stage.

---

## Plan d'action recommandé

### Étape 1: Créer le modal (Solution 1)
```
Créer: src/app/components/EmailConfirmationModal.tsx
Temps: 1-2h
```

### Étape 2: Importer et rendre dans TaskTabNew
```typescript
import { EmailConfirmationModal } from './EmailConfirmationModal';

// Ajouter avant la dernière </div>
<EmailConfirmationModal
  isOpen={showEmailModal}
  task={selectedTaskForEmail}
  clientId={clientId}
  onClose={() => {
    setShowEmailModal(false);
    setSelectedTaskForEmail(null);
  }}
  onSuccess={() => {
    setShowEmailModal(false);
    setSelectedTaskForEmail(null);
    loadTasks();
  }}
/>
```

### Étape 3: Tester
- Cliquer sur le bouton "Envoyer l'email de confirmation de RDV"
- Vérifier que le modal s'ouvre
- Saisir un email et envoyer
- Vérifier que la tâche est mise à jour

### Étape 4: Déplacer la tâche au bon stage
- Modifier le template pour placer la tâche au stage correct

---

## Checklist finale

- [ ] Créer `EmailConfirmationModal.tsx`
- [ ] Importer le composant dans `TaskTabNew.tsx`
- [ ] Rendre le modal dans le JSX
- [ ] Tester que le modal s'ouvre
- [ ] Tester l'envoi d'email
- [ ] Vérifier que l'historique d'envoi se met à jour
- [ ] Déplacer la tâche au bon stage
- [ ] Tester le flux complet

---

## Notes importantes

1. **Le composant `MeetingConfirmationTask` fonctionne bien** - Ne pas le toucher
2. **Seul le modal manque** - Focus sur la création/ajout du modal
3. **Les states existent déjà** - Juste besoin de le rendre
4. **Réutiliser le pattern UI existant** - Dialog, Button, etc. du dossier `/ui`
5. **L'API d'envoi est prête** (Phase 1 Brevo removal) - Adapter simplement l'appel

---

## Questions avant de commencer?

- **Quelle solution préfères-tu?** (Solution 1 est recommandée)
- **As-tu une preference pour le design du modal?**
- **Qui saisit l'email du client?** (L'utilisateur ou c'est pré-rempli?)
- **Y a-t-il un template d'email par défaut?**

Dis-moi et je peux **implémenter la solution maintenant** ! 🚀
