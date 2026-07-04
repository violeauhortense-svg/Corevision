Contexte :
Tu es un expert UX/UI spécialisé dans les applications professionnelles pour la gestion de patrimoine. Tu dois créer **une interface admin premium** pour gérer l’ingestion et l’indexation de PDF dans une base de connaissances IA. L’interface est destinée uniquement aux administrateurs autorisés.

Objectifs :
- Permettre l’upload de fichiers PDF
- Permettre de sélectionner une catégorie (Fiscal, Civil, Produit, Conformité, Pédagogique)
- Permettre d’indiquer des paramètres avancés d’ingestion (taille chunks, overlap, nettoyage)
- Permettre le déclenchement automatique de l’indexation
- Afficher un journal d’indexation (statut, nombre de chunks, date)
- Préparer les PDF pour ingestion backend (Supabase + pgvector + Mistral)
- Interface moderne, professionnelle, intuitive et responsive

Fonctionnalités à inclure :

1. **Upload PDF**
   - Drag & drop ou bouton “Choisir un fichier”
   - Nom du document éditable
   - Sélecteur de catégorie (dropdown)
   - Indication taille maximale
   - Bouton “Indexer le document”

2. **Paramètres avancés**
   - Champ “Taille des chunks” (ex : 500–1000 tokens)
   - Champ “Overlap” (ex : 150 tokens)
   - Checkbox “Nettoyage automatique du texte”
   - Option “Priorité haute” pour documents urgents

3. **Journal d’indexation**
   - Liste avec colonnes :
     - Nom du document
     - Statut (En cours / Terminé / Erreur)
     - Nombre de chunks générés
     - Date d’indexation
     - Actions : “Supprimer de l’index”, “Réindexer”
   - Couleur des statuts pour une lecture rapide

4. **Sécurité et accessibilité**
   - Interface accessible uniquement aux administrateurs
   - Gestion visuelle des droits (login / rôle)
   - Indication des actions non autorisées

5. **Notifications et retours**
   - Loading spinner lors du traitement
   - Message de succès ou d’erreur après indexation
   - Option de télécharger le log complet de l’indexation

6. **Design premium**
   - Interface claire, épurée, professionnelle
   - Responsive desktop & tablette
   - Utilisation de couleurs sobres et cohérentes (ex : bleu professionnel, gris clair, accents verts pour succès)
   - Iconographie intuitive pour upload, statut, paramètres

7. **Flow de validation**
   - Dès que l’admin clique sur “Indexer le document” :
     - Trigger backend Supabase / Edge Function
     - Upload PDF + catégorie + paramètres
     - Extraction texte + chunking + embeddings
     - Stockage pgvector
   - Journal mis à jour automatiquement avec les résultats

Sortie attendue :
- Prototype complet prêt à intégrer dans Make ou Figma
- Tous les écrans, boutons, dropdowns, tableaux et feedback visuels inclus
- Flux complet d’upload → indexation → retour d’état
- Exportable en JSON ou composant Figma

Consignes finales :
- Design orienté utilisateur professionnel CGP
- Prévoir des placeholders pour la connexion API et le traitement réel
