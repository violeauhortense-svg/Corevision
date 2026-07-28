# Exemple d'utilisation - Système de Gestion des Mails

## 📧 Scénario 1 : Traitement d'un Mail Client Urgent

### Situation
Jean Dupont (client) envoie un mail urgent : "Question urgente sur mon assurance-vie"

### Étapes
1. **Accès au Hub** → Cliquer sur "Gestion des Mails"
2. **État initial** : Mail apparaît en **"À traiter"** (rouge)
3. **Lire le mail** : Cliquer sur le mail → Voir le panneau détails
4. **Ajouter des notes** (auto-sauvegardé):
   ```
   Mail de Jean Dupont concernant son assurance-vie.
   Action requise : Analyser le contrat et préparer une réponse détaillée.
   Contact : À appeler demain matin.
   ```
5. **Changement d'état** : Cliquer sur "En cours" → État passe au bleu
6. **Répondre au client** (optionnel):
   - Cliquer "Répondre au client"
   - Remplir le sujet et le message
   - Envoyer → Mail envoyé via Outlook
   - État passe à "En cours"

### Flux visible
```
À traiter (rouge) → En cours (bleu) → [Réponse envoyée] → En attente de GL
```

---

## 📋 Scénario 2 : Traitement par le GL (Gestionnaire)

### Situation
Sophie Martin a reçu des documents complémentaires, traitement en cours, en attente de validation

### Étapes
1. **GL voit** : Mail en état "À valider GL" (jaune)
2. **GL examine** : Ouvre le mail, lit les notes de traitement
3. **Notes de GL** : Ajoute ses commentaires (auto-sauvegardé):
   ```
   Documents reçus le 28/07/2026
   ✓ Avis d'imposition 2023 - OK
   ✓ Relevé bancaire - OK
   Tous les documents requis sont présents. Validation approuvée.
   ```
4. **Validation** : Cliquer sur "Validé GL" → État passe au vert
5. **Finalisation** : Cliquer sur "Terminé" → Mail archivé (gris)

### Flux visible
```
À valider GL (jaune) → Validé GL (vert) → Terminé (gris) [Archivé]
```

---

## 🔄 Scénario 3 : Changement de Statut en Masse

### Situation
Batch de 5 mails en "À traiter", prêts à commencer

### Étapes
1. **Filtrer** : Utiliser "À traiter" ou chercher dans la barre
2. **Pour chaque mail** :
   - Cliquer pour ouvrir
   - Ajouter notes si nécessaire
   - Changer état à "En cours" (1 clic)
   - Les notes se sauvegardent auto pendant que vous travaillez
3. **Plus rapide qu'avant** : Pas besoin de cliquer [✅ Enregistrer]

---

## 📊 Scénario 4 : Suivi d'un Dossier Client

### Situation
Vous avez 12 mails pour le client "Marie Dubois"

### Étapes
1. **Rechercher** : Taper "marie" ou "dubois" dans la barre
2. **Voir l'historique** :
   - Mail 1: "À traiter" depuis 2h
   - Mail 2: "En cours" depuis 1h
   - Mail 3: "Validé GL" depuis 30min
   - Mail 4: "Terminé" (archivé)
3. **Accélérer un mail bloqué** :
   - Cliquer sur mail en "À traiter" depuis longtemps
   - Ajouter note d'urgence
   - Changer à "En cours"
   - Assign à quelqu'un si nécessaire

---

## 💡 Tips & Tricks

### Tip 1 : Notes rapides
Ne pas attendre la fin du traitement pour ajouter les notes. Elles se sauvegardent auto après 1.5s, vous pouvez continuer à travailler.

### Tip 2 : Changer d'état rapidement
Pas besoin d'ouvrir le mail entièrement. Les boutons de statut peuvent être ajoutés à la liste pour changement ultra-rapide.

### Tip 3 : Filtrer par statut
Chaque onglet filtre déjà par type (Client/Interne/Archive). Utilisez les badges en haut pour avoir une vue rapide.

### Tip 4 : Onglet Archive
Une fois "Terminé", le mail disparaît des autres onglets mais reste consultable dans "Archive".

### Tip 5 : Intégration Outlook
La réponse s'envoie directement via Outlook. Pas besoin de recopier l'adresse email du client.

---

## 🎯 Cas d'Usage Par Rôle

### Conseiller
- Traite les mails des clients
- Ajoute des notes de suivi
- Envoie des réponses directes
- Passe à "À valider GL" quand terminé

### GL (Gestionnaire)
- Valide le travail des conseillers
- Change "À valider GL" → "Validé GL"
- Peut ajouter des commentaires ou demandes de modification
- Finalise en "Terminé"

### Administrateur
- Voit tous les mails
- Peut réassigner si quelqu'un n'a pas traité un mail
- Gère les files d'attente
- Archive les mails terminés

---

## ⏰ Temps de Traitement Estimé

| Action | Durée |
|--------|-------|
| Ouvrir un mail | 1s |
| Ajouter une note | 30s |
| Changer l'état | 1s |
| Sauvegarde auto | 1.5s (invisible) |
| Répondre au client | 2-5min |
| **Total par mail** | **2-10min** |

---

## 🚀 Améliorations Futures

- [ ] Assignation automatique basée sur la charge
- [ ] Alertes de mails bloqués depuis > 24h
- [ ] Intégration avec le calendrier pour les appels
- [ ] Modèles de réponse par type de mail
- [ ] Historique complet avec qui a changé quoi et quand
- [ ] Export en PDF des mails traités
- [ ] Intégration avec CRM pour suivi client
- [ ] Priorisation automatique basée sur urgence
