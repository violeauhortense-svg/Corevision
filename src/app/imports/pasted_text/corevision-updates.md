CONTEXTE
Tu interviens sur une application existante appelée “CoreVision”, logiciel d’audit patrimonial.
⚠️ Contraintes impératives :
•	Ne faire aucune refonte globale 
•	Ne pas modifier l’architecture ni la navigation 
•	Corriger, fiabiliser et enrichir uniquement 
•	Approche modulaire, non destructive et orientée métier CGP 
________________________________________
📅 1. TRAÇABILITÉ — CORRECTION CRITIQUE
🔹 Problème
Les dates de saisie ne sont pas enregistrées dans :
•	Foyer 
•	Revenus & imposition 
•	Patrimoine 
•	Objectifs 
🔹 Correction attendue
Ajouter automatiquement :
•	Date de création 
•	Date de dernière modification 
👉 À chaque création ET modification
🔹 Contraintes
•	Ne pas écraser les données existantes 
•	Prévoir historisation si possible 
________________________________________
📇 2. CONTACTS PROFESSIONNELS — BUG DE PERSISTANCE
🔹 Problème
Les contacts disparaissent après sortie de la fiche client
🔹 Correction attendue
•	Sauvegarde automatique en base 
•	Rechargement à chaque ouverture 
🔹 Vérifications
•	Création persistée 
•	Modification persistée 
•	Suppression persistée 
________________________________________
📊 3. PRÉ-ANALYSE — CORRECTIONS MAJEURES
________________________________________
🧱 3.1 PYRAMIDE PATRIMONIALE (REMPLACEMENT COMPLET)
🎯 Objectif
Remplacer la pyramide actuelle par une pyramide métier personnalisée (selon le schéma fourni)
________________________________________
🔹 STRUCTURE OBLIGATOIRE (bas → haut)
1. Résidence principale
•	Base de la pyramide 
•	Actif non productif mais structurant 
________________________________________
2. Épargne de précaution
•	Liquidités sécurisées : 
o	Livret A 
o	LDDS 
o	Cash 
👉 Objectif :
•	3 à 6 mois de revenus 
•	ou 6 à 12 mois de charges 
________________________________________
3. Fonds en euros
•	Assurance-vie sécurisée 
•	Rôle d’amortisseur 
________________________________________
4. Bloc structuré :
👉 À subdiviser en 3 catégories distinctes :
•	Bourse : 
o	Actions 
o	ETF 
o	Obligations 
•	Immobilier : 
o	Direct 
o	SCPI 
o	Fonds immobiliers 
•	Private Equity : 
o	Non coté 
________________________________________
5. Alternatifs
•	Crypto 
•	Or / matières premières 
•	Crowdfunding 
👉 Actifs risqués / opportunistes
________________________________________
🔹 LOGIQUE DE CLASSIFICATION AUTOMATIQUE
Chaque actif doit être automatiquement affecté :
•	Livret → précaution 
•	Fonds euros → fonds euros 
•	ETF → bourse 
•	SCPI → immobilier 
•	Private equity → dédié 
•	Crypto → alternatifs 
________________________________________
🔹 DOUBLE AFFICHAGE
1. Situation actuelle
•	Répartition réelle 
2. Situation cible
•	% configurables par niveau 
________________________________________
🔹 COMPARAISON
Afficher :
•	Écart réel vs cible 
•	Sur / sous allocation 
________________________________________
🔹 UX
•	Pyramide visuelle claire 
•	Code couleur par étage 
•	% affichés 
•	Tooltip explicatif 
•	Détail des actifs au clic 
________________________________________
🔹 EXPLOITATION IA
Générer automatiquement :
•	Alertes (déséquilibre) 
•	Recommandations 
________________________________________
💸 3.2 CAPACITÉ D’ÉPARGNE — CORRECTION
🔹 Problème
•	Revenus incohérents 
•	Probable double comptabilisation 
🔹 Correction attendue
Recalcul basé sur :
•	Revenus réels consolidés (incrémenté dans l’onglet revenus et impositions)
🔹 Vérification
•	Suppression des doublons 
•	Contrôle de cohérence automatique 
________________________________________
📉 3.3 CALCULS PATRIMONIAUX
🔹 Problèmes
•	Patrimoine total incorrect => il faut prendre en considération le patrimoine net ici)
•	Revenus annuels faux => allez chercher dans onglet revenus et imposition
•	Impôt => allez le chercher dans onglet revenu et imposition
🔹 Correction attendue
•	Patrimoine net = Actifs – Passifs 
•	Revenus = données réellement saisies 
•	Impôt = basé sur données fiscales 
________________________________________
🚫 3.4 SIMULATION / PROJECTION
🔹 Action
•	Supprimer : 
o	simulation 
o	projection 
________________________________________
🧠 3.5 SCORING & RECOMMANDATIONS
🔹 Objectif
Rendre le moteur compréhensible et pertinent
🔹 Améliorations
•	Clarifier logique de scoring 
•	Rendre visible :
→ pourquoi une recommandation est faite 
🔹 Catégorisation
•	Urgent 
•	Optimisation 
•	Stratégique 
________________________________________
🕓 4. HISTORIQUE (LOGIQUE CRM)
🎯 Objectif
Créer une traçabilité complète du client
________________________________________
🔹 Historiser automatiquement :
•	Commandes d’audit 
•	Générations d’audit (c’est-à-dire une fois que l’audit est validé par l’outil corevision et qu’il est incrémenté dans l’onglet audit de la fiche client)
•	Emails (envoyés / reçus) 
•	RDV 
•	Appels téléphoniques 
•	Évolution des recommandations : 
o	emises
o	validées 
o	refusées 
o	en attente 

________________________________________
🔹 UX
•	Timeline chronologique 
•	Filtres par type d’événement 
________________________________________
✅ 5. MODULE TÂCHES
🔹 Problème
Les tâches actives (R0) ne sont pas visibles
🔹 Correction attendue
Afficher :
•	Toutes les tâches actives 
•	Inclure priorités R0 
________________________________________
🔹 UX
•	Ne modifie pas l’UX actuel
________________________________________
⚠️ CONTRAINTES FINALES
•	Ne jamais casser l’existant 
•	Toujours enrichir, jamais remplacer brutalement 
•	Structurer les données pour exploitation IA 
•	Maintenir UX simple, professionnelle
