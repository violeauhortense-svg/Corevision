Tu es un expert en architecture de logiciels SaaS métier et en UX logicielle.

Ta mission est d'analyser la structure du logiciel afin de vérifier la cohérence de sa logique fonctionnelle, la circulation des données et la clarté de l'architecture. 

OBJECTIF :
Identifier les incohérences structurelles, les duplications logiques, les flux de données inefficaces et les dépendances mal définies.

Le logiciel est structuré comme suit :

--------------------------------
ARCHITECTURE GÉNÉRALE
--------------------------------

Le logiciel comporte 5 modules principaux :

1. TABLEAU DE BORD
- visualisation des indicateurs
- pipeline client
- activités récentes

2. CLIENTS
- liste de tous les clients
- résumé des principales informations
- accès direct aux fiches clients

3. FICHE CLIENT

Structure :

HEADER CLIENT
- informations du client principal
- synthèse rapide du foyer

ONGLETS FICHE CLIENT

PARTIE 1 : SAISIE DES DONNÉES CLIENT

• FOYER
composition familiale

• REVENUS ET IMPOSITION

• PATRIMOINE
- patrimoine personnel
- patrimoine professionnel

• OBJECTIFS

PARTIE 2 : PRODUCTION

• TÂCHES

• DOCUMENTS

• AUDIT

• HISTORIQUE

4. ORGANISATION

AGENDA
- lié aux tâches
- lié aux recommandations issues de l'audit

TO DO LIST
- liste globale des tâches
- chaque tâche doit afficher une cartouche client

5. ADMINISTRATEUR

COMMANDE COREVISON
- déclenchée depuis l'onglet OBJECTIFS de la fiche client
- génère un modal de rédaction d'audit

PROCESSUS COREVISON :

le logiciel doit :

1 récupérer toutes les données de saisie client :
- foyer
- revenus et imposition
- patrimoine
- objectifs

2 interroger la BASE DE CONNAISSANCES

3 générer un rapport d'audit

4 détecter les incohérences possibles :
exemples :
- taux fiscaux différents selon les documents
- règles juridiques contradictoires
- montages incohérents

5 afficher les incohérences détectées avec :
- contenu de la règle
- date du document source

6 permettre à l'utilisateur de valider l'information correcte

BASE DE CONNAISSANCES

répertoire de documentation utilisé pour :
- les règles fiscales
- les règles sociales
- les règles juridiques
- les méthodes de calcul
- les montages patrimoniaux

--------------------------------

MISSION

Analyse cette architecture et vérifie :

1. la cohérence de la circulation des données
2. les dépendances logiques entre modules
3. les endroits où la logique peut casser
4. les éléments qui devraient être centralisés
5. les flux inutiles ou redondants
6. les modules qui devraient communiquer différemment

Puis :

• propose une architecture logique simplifiée
• propose les flux de données optimaux
• propose les corrections structurelles nécessaires

Enfin :

produis un schéma logique du logiciel avec :

- sources de données
- modules consommateurs
- modules producteurs
- flux d'information

Le but est d'obtenir une architecture claire, stable et scalable.
