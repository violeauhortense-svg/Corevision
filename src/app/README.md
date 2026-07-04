# 🏛️ CRM CGP - Gestion de Patrimoine

Application CRM complète dédiée aux **Conseillers en Gestion de Patrimoine (CGP)** pour le suivi client et la gestion de patrimoine.

---

## 🎯 Fonctionnalités principales

### 🔐 Authentification
- Écran de connexion sécurisé
- Accès réservé aux conseillers CGP
- Gestion de session (démo)

### 👤 Profil Conseiller
Informations complètes du CGP :
- **Identité** : Nom, Prénom
- **Entreprise** : Nom, Métier
- **Contact** : Email, Téléphone
- **Adresse** : Adresse complète, Code postal, Ville
- **Certifications** :
  - Association professionnelle (ANACOFI, CNCIF, etc.)
  - Habilitation CJA
  - N° Carte T

### 📊 Pipeline Client (R0 → R2 → Rsuivi)
- **R0** : Premier contact
- **R0-R1** : Qualification
- **R1** : Premier rendez-vous
- **R1-R2** : Analyse patrimoniale
- **R2** : Proposition
- **Rsuivi** : Suivi régulier

### 👥 Gestion Clients
- Liste complète des clients
- Filtrage par statut
- Cartes clients avec informations clés
- Vue détaillée par client

### 📁 Fiche Client Complète

#### Onglet Foyer
- Régime matrimonial
- Informations du conjoint
- Liste des enfants
- Mode édition

#### Onglet Patrimoine
- **Actifs financiers** : PEA, assurance-vie, comptes titres
- **Immobilier** : Résidence principale, locatif
- **Passifs** : Crédits, emprunts
- Graphiques en anneaux (pie charts)
- Édition par catégorie

#### Onglet Documents
- Documents clients généraux
- Documents réglementaires par étape
- Upload et téléchargement
- Statuts (en attente, complété, requis)

#### Onglet Tâches
- Tâches automatiques selon l'étape pipeline
- Checkbox de complétion
- Historique des tâches
- Blocage de progression si tâches incomplètes

#### Onglet Audit
- Recommandations patrimoniales
- Priorités (haute, moyenne, basse)
- Dates limites
- Suivi des actions

### 📄 Documents Réglementaires

Documents spécifiques par étape :

**R0-R1** :
- DER (Document d'Entrée en Relation)
- Liste des documents à collecter

**R1** :
- LAB-FT (Lutte Anti-Blanchiment - Financement Terrorisme)
- Gel des avoirs
- Recueil d'information
- Questionnaire investisseur

**R1-R2** :
- Mail compte rendu
- Lettre de mission
- Mandat recherche IAS

**R2** :
- Audit patrimonial signé
- Rapport d'adéquation
- Copie dossier souscription

### 📅 Agenda
- Vue calendrier mensuelle
- Rendez-vous clients
- Code couleur par type
- Gestion des événements

### ✅ To-Do List
- Tâches globales du conseiller
- Filtres (toutes, actives, complétées)
- Priorités et dates limites
- Statistiques de progression

---

## 🎨 Interface

### Design
- ✨ Interface moderne et professionnelle
- 🎨 Dégradés bleu-violet
- 📱 Responsive (desktop, tablette, mobile)
- 🎯 Navigation intuitive

### Navigation
- **Sidebar** avec icônes
- **Tableau de bord**
- **Clients**
- **Réglementaires**
- **Agenda**
- **To-Do List**
- **Mon profil**

---

## 🛠️ Technologies

- **React** avec TypeScript
- **Tailwind CSS** v4
- **Lucide React** (icônes)
- **Recharts** (graphiques)
- **Vite** (build tool)

---

## 📂 Structure du projet

```
/
├── components/
│   ├── LoginView.tsx          # Écran de connexion
│   ├── ProfileView.tsx        # Profil utilisateur CGP
│   ├── Sidebar.tsx            # Navigation latérale
│   ├── Dashboard.tsx          # Tableau de bord avec pipeline
│   ├── ClientsView.tsx        # Liste des clients
│   ├── ClientDetailView.tsx   # Détail client (5 onglets)
│   ├── RegulatoryView.tsx     # Documents réglementaires
│   ├── AgendaView.tsx         # Calendrier
│   └── TodoView.tsx           # To-Do List
├── types/
│   └── client.ts              # Types TypeScript
├── utils/
│   └── taskTemplates.ts       # Templates de tâches
├── App.tsx                    # Point d'entrée
└── README.md                  # Ce fichier
```

---

## 🚀 Démarrage

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```

### Build production
```bash
npm run build
```

---

## 🔐 Connexion (Démo)

Pour accéder à l'application :
- **Email** : n'importe quel email valide (avec @)
- **Mot de passe** : 6 caractères minimum

⚠️ **En production** : Remplacer par une vraie authentification avec backend sécurisé.

---

## 📊 Workflow type

1. **Connexion** du conseiller CGP
2. **Tableau de bord** : Vue d'ensemble de la pipeline
3. **Ajout client** : Créer un nouveau client (statut R0)
4. **Remplir la fiche** :
   - Onglet Foyer : Situation familiale
   - Onglet Patrimoine : Actifs, immobilier, passifs
   - Onglet Documents : Upload des documents
5. **Tâches** : Compléter les tâches de l'étape actuelle
6. **Documents réglementaires** : Vérifier et uploader les documents requis
7. **Progression** : Faire avancer le client dans la pipeline (R0 → R1 → R2 → Rsuivi)
8. **Audit** : Ajouter des recommandations patrimoniales
9. **Suivi** : Agenda et To-Do pour les actions

---

## 🎯 Cas d'usage

### Pour un CGP indépendant
- Gérer son portefeuille de clients
- Suivre les rendez-vous et les tâches
- Centraliser les documents
- Assurer la conformité réglementaire

### Pour un cabinet CGP
- Multi-conseillers (avec système de profils)
- Suivi unifié des clients
- Workflow standardisé
- Conformité AMF/ACPR

---

## 📈 Évolutions futures

### Backend
- [ ] API REST (Node.js, Express)
- [ ] Base de données (PostgreSQL, MongoDB)
- [ ] Authentification JWT
- [ ] Upload de fichiers (S3, Azure Storage)

### Fonctionnalités
- [ ] Export PDF des fiches clients
- [ ] Signature électronique des documents
- [ ] Calculs fiscaux automatiques
- [ ] Intégration emails (Gmail, Outlook)
- [ ] Multi-utilisateurs (rôles et permissions)
- [ ] Notifications en temps réel
- [ ] Rapports et statistiques avancés

### Sécurité
- [ ] Chiffrement des données sensibles
- [ ] 2FA (authentification à deux facteurs)
- [ ] Logs d'audit
- [ ] Conformité RGPD
- [ ] Sauvegarde automatique

---

## 📝 Conformité réglementaire

### Documents AMF/ACPR
✅ DER (Document d'Entrée en Relation)
✅ LAB-FT (Lutte Anti-Blanchiment)
✅ Questionnaire investisseur
✅ Lettre de mission
✅ Rapport d'adéquation

### Traçabilité
✅ Historique des modifications
✅ Dates de création/modification
✅ Workflow de validation

---

## 💼 À propos

**CRM CGP** est un outil professionnel conçu pour simplifier la gestion quotidienne des Conseillers en Gestion de Patrimoine.

### Objectifs
- ✅ Gagner du temps sur les tâches administratives
- ✅ Assurer la conformité réglementaire
- ✅ Améliorer le suivi client
- ✅ Centraliser l'information
- ✅ Professionnaliser les process

---

## 📞 Support

Pour toute question ou suggestion :
- 📧 Email : support@example.com
- 📖 Documentation : Consultez `/AUTHENTICATION_SETUP.md`

---

## 📄 Licence

Projet privé - Tous droits réservés

---

## 🎉 Remerciements

Merci d'utiliser **CRM CGP** pour votre activité de conseil en gestion de patrimoine !

---

**Version actuelle** : 1.0.0  
**Dernière mise à jour** : Février 2026
