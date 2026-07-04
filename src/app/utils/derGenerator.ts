// Fonction utilitaire pour générer le contenu complet du DER
export function generateDERContent(clientData: any, cgpData: any, config: any): string {
  return `
DOCUMENT D'ENTRÉE EN RELATION (DER)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMATIONS SUR LE CABINET

${cgpData.societe || 'Cabinet de Gestion de Patrimoine'}
${cgpData.prenom} ${cgpData.nom}
${cgpData.profession || 'Conseiller en Gestion de Patrimoine'}

Adresse : ${cgpData.adresse}
Email : ${cgpData.email}
Téléphone : ${cgpData.telephone}
${config?.numeroOrias ? `N° ORIAS : ${config.numeroOrias}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMATIONS CLIENT

Nom : ${clientData.lastName || clientData.nom || '[Nom]'}
Prénom : ${clientData.firstName || clientData.prenom || '[Prénom]'}
Email : ${clientData.email || '[Email]'}
Téléphone : ${clientData.phone || clientData.telephone || '[Téléphone]'}
Adresse : ${clientData.address || clientData.adresse || '[Adresse]'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. OBJET DU DOCUMENT

Le présent Document d'Entrée en Relation (DER) a pour objet de formaliser notre relation professionnelle dans le cadre de prestations de conseil en gestion de patrimoine.

Ce document définit les modalités de notre collaboration et permet de mieux vous connaître afin de vous proposer des solutions adaptées à votre situation patrimoniale, financière et fiscale.

2. PRÉSENTATION DE NOS SERVICES

En tant que Conseiller en Gestion de Patrimoine, nous vous accompagnons dans :

• L'analyse de votre situation patrimoniale globale
• La définition de vos objectifs à court, moyen et long terme
• L'élaboration de recommandations personnalisées
• La mise en œuvre de solutions adaptées à votre profil
• Le suivi régulier de votre patrimoine

3. ENGAGEMENT DU CONSEILLER

Nous nous engageons à :

• Analyser votre situation patrimoniale de manière complète et objective
• Vous proposer des solutions personnalisées et adaptées à vos besoins
• Assurer un suivi régulier de votre dossier
• Respecter la confidentialité de vos informations
• Vous informer de manière claire et transparente
• Agir dans votre intérêt exclusif

4. INFORMATIONS RECUEILLIES

Dans le cadre de notre mission, nous recueillons les informations suivantes :

• Situation personnelle et familiale (état civil, régime matrimonial, etc.)
• Situation professionnelle (revenus, charges, projets)
• Patrimoine financier (épargne, placements, assurances)
• Patrimoine immobilier (résidence principale, investissements locatifs)
• Objectifs patrimoniaux (préparation retraite, transmission, optimisation fiscale)
• Profil de risque et horizon d'investissement

5. PROTECTION DES DONNÉES PERSONNELLES

Vos données personnelles sont collectées et traitées conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.

• Responsable du traitement : ${cgpData.societe || 'Cabinet'}
• Finalité : Conseil en gestion de patrimoine
• Durée de conservation : Durée de la relation commerciale + obligations légales
• Droits : Accès, rectification, effacement, opposition, portabilité

Vos données ne seront en aucun cas transmises à des tiers sans votre consentement explicite.

Vous disposez d'un droit d'accès, de rectification et d'opposition sur vos données en contactant : ${cgpData.email}

6. INFORMATIONS SUR LES PRODUITS ET SERVICES

Les recommandations que nous formulons portent sur :

• Assurance-vie et contrats de capitalisation
• Placements financiers (OPCVM, ETF, titres vifs)
• Investissements immobiliers (SCPI, SCI, immobilier locatif)
• Produits de défiscalisation (PER, FCPI, FIP, etc.)
• Stratégies de transmission (donations, démembrement, etc.)
• Optimisation fiscale dans le respect de la législation

Nous vous présentons uniquement des solutions adaptées à votre profil de risque et à vos objectifs patrimoniaux.

7. RÉMUNÉRATION

Notre rémunération peut prendre différentes formes :

• Honoraires de conseil (facturation directe au client)
• Commissions versées par les établissements financiers
• Rétrocessions sur les produits souscrits

Le mode de rémunération vous sera systématiquement communiqué avant toute souscription, conformément à la réglementation en vigueur.

8. OBLIGATIONS RÉGLEMENTAIRES

En tant que Conseiller en Gestion de Patrimoine, nous sommes soumis à :

• L'immatriculation ORIAS (Organisme pour le Registre des Intermédiaires en Assurance)
• Les règles de déontologie de la profession
• L'obligation de conseil et d'information
• La souscription d'une assurance responsabilité civile professionnelle
• Les obligations de lutte contre le blanchiment et le financement du terrorisme

${config?.numeroOrias ? `Notre numéro ORIAS : ${config.numeroOrias}\nVérifiable sur www.orias.fr` : ''}

9. GESTION DES RÉCLAMATIONS

En cas de réclamation, vous pouvez nous contacter par :

• Email : ${cgpData.email}
• Téléphone : ${cgpData.telephone}
• Courrier : ${cgpData.adresse}

Nous nous engageons à traiter votre réclamation dans les meilleurs délais.

Si la réponse ne vous satisfait pas, vous pouvez saisir le médiateur de la consommation compétent.

10. GRATUITÉ DU PREMIER ENTRETIEN

Le premier entretien est totalement gratuit et sans engagement de votre part.

Il nous permet de :
• Faire connaissance
• Comprendre vos besoins et objectifs
• Vous présenter nos services
• Répondre à vos questions

Au terme de cet entretien, vous êtes libre de donner suite ou non à notre proposition d'accompagnement.

11. DROIT DE RÉTRACTATION

Conformément à la réglementation, vous disposez d'un délai de rétractation pour tout contrat souscrit :

• Assurance-vie : 30 jours calendaires
• Crédit immobilier : 10 jours calendaires
• Autres produits financiers : selon la réglementation applicable

Les modalités de rétractation vous seront précisées dans chaque contrat.

12. DURÉE ET RÉSILIATION

Le présent Document d'Entrée en Relation est conclu pour la durée de notre relation professionnelle.

Vous pouvez y mettre fin à tout moment en nous informant par écrit (email ou courrier recommandé).

De notre côté, nous pouvons également mettre fin à notre relation si les conditions ne permettent plus un accompagnement de qualité, moyennant un préavis raisonnable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MENTIONS LÉGALES

Date de création : ${new Date().toLocaleDateString('fr-FR')}
Cabinet : ${cgpData.societe || 'Cabinet de Gestion de Patrimoine'}
${config?.numeroOrias ? `ORIAS : ${config.numeroOrias}` : ''}
${config?.numeroSiret ? `RCS/SIRET : ${config.numeroSiret}` : ''}

${config?.assuranceRCP ? `Assurance Responsabilité Civile Professionnelle :\n${config.assuranceRCP}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

En signant ce document, vous reconnaissez avoir pris connaissance de son contenu et acceptez les conditions de notre collaboration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}
