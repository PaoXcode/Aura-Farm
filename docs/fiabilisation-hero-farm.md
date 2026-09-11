# Fiabilisation de HERO FARM

## Référence et portée

Le chantier part du commit audité `68712b14968e948a14fffba362ed13c03814e63d`. Le dépôt était propre sur la branche `work` au début de l'intervention. Cette livraison fiabilise les règles et la persistance existantes ; elle **ne valide pas professionnellement les programmes** et ne suffit pas à déclarer l'application prête à commercialiser.

## Charges, assistance et saisies

- Les charges sont classées en `total`, `per_dumbbell`, `lest`, `assistance` et `bodyweight`. Une unité identique n'autorise une comparaison que pour la même représentation ; tout transfert automatique entre variantes est désactivé.
- Une variante utilise son propre état enregistré, puis son RP10 propre. Sans ces données, la charge reste vide avec une consigne de calibration ; `baseLoad` n'est plus affiché comme objectif personnel.
- Atteindre le haut de fourchette sur une variante assistée réduit l'assistance du pas configuré, avec un plancher à zéro et le libellé « Assistance réduite ». Un plateau assisté maintient la valeur faute de règle de récupération validée. L'assistance est exclue du tonnage et des records de charge/volume.
- Les répétitions réalisées sont des entiers strictement positifs. Vide signifie « non renseigné » ; zéro, décimales, négatifs et valeurs non finies sont invalides. Les charges acceptent les décimales finies, jamais les négatifs ; zéro est admis pour le lest et l'assistance.
- Ces validateurs sont employés par la saisie normale/Focus (champs partagés), la clôture, l'édition et le CSV. Une erreur bloque la mutation et reste visible dans le champ (`aria-invalid`).

## Sauvegarde JSON v4

Format courant :

```json
{
  "schema": "hero-farm-backup",
  "version": 4,
  "exportedAt": 0,
  "storage": { "paogramme_log_v2": "[]" }
}
```

`storage` contient les seules clés HERO FARM autorisées : journal/configuration, programme, préférences, brouillon et identifiant de séance, chronomètre (échéance, vue et son), onboarding, ainsi que les préfixes `last_`, `state_`, `rp10_`, `records_` et `eff_`. Les clés étrangères sont refusées à l'import et jamais effacées. Une sauvegarde sans clé doit porter `empty: true`; `{storage:{}}` seul est incomplet.

La restauration valide et migre avant d'écrire. Une copie `paogramme_recovery_backup_v1` est préparée, les seules clés applicatives sont remplacées, et une erreur déclenche une remise en place de l'ancien état. Le résultat n'est annoncé qu'après les écritures. Le chronomètre conserve son échéance sérialisée : la restauration ne joue aucun son et son code normal de reprise décide ensuite si l'échéance est passée.

### Migration v3 et limites historiques

Les véritables exports `v3` (`programMode`, `log`, `cfg`, groupes `last`, `state`, `rp10`) sont aplatis vers v4. Les préférences, records, brouillon et états du chronomètre absents d'un ancien fichier restent absents : aucun résultat sportif n'est inventé. Les anciens journaux ne portant qu'un total conservent la marque `legacyAggregate` après édition ; leur nombre de séries prescrit est utilisé comme convention de compatibilité, sans inventer une répartition série par série.

## Cycle de séance et états dérivés

- Un `sessionId` naît à l'ouverture, vit dans le brouillon et est repris après rechargement. Le brouillon contient aussi la base de progression de début de séance.
- « Terminer / Enregistrer » construit une séance partielle, écrit le journal avec cet identifiant, puis supprime le brouillon. L'overlay de succès ne s'ouvre qu'après réussite. « Retour » ne fait que naviguer. La contrainte d'unicité de l'identifiant rend le double clic et une seconde clôture idempotents.
- Une écriture impossible conserve le brouillon. Les exercices non renseignés restent explicites et ne déclenchent pas d'échec de progression. Les séries réalisées viennent des seules valeurs valides de `setReps`.
- Après édition, suppression ou import, les états `last_`, `state_` et `records_` sont effacés puis rejoués dans l'ordre `(timestamp, id)`. Le recalcul est déterministe et retire les records fantômes. L'e1RM est désactivé : le total de répétitions d'un exercice n'est jamais passé à une formule de série.
- La « dernière séance » est filtrée par lettre **et programme**. L'objectif sur quatre semaines utilise le programme courant (Musculation 4/semaine, Hybride 3/semaine) ; c'est la convention affichée pour une période traversant un changement. Les séries pondérées et la fatigue sont présentées comme estimations issues du journal, sans portée médicale. La durée affichée est une estimation planifiée et non une mesure réelle.
- Le CSV conserve sa fusion par séance datée à la minute. Réimporter le même export ignore les clés déjà présentes au lieu d'ajouter silencieusement un doublon.

## Vérifications ciblées

La commande `npm test` exécute le noyau `hero-farm-core.js` réellement chargé par `index.html`. Elle couvre : incompatibilité machine/haltères, progression des tractions/dips assistés et zéro, validation, séries partielles, sauvegarde/restauration complète, formats incomplets/inconnus, migration v3, panne d'écriture avec récupération, clôture/déduplication et absence d'e1RM.

Les contrôles manuels attendus via `python3 -m http.server 8000` sont : démarrage, saisie et erreurs proches des champs, Focus, remplacement, reprise, clôture partielle, historique/édition/suppression, thèmes et chronomètre, à largeur mobile et bureau. L'avertissement « Pour entendre l'alarme, garde l'app ouverte » est conservé. Une émulation ne prouve ni le comportement d'un téléphone réel, ni un son écran verrouillé.

## Backlog hors chantier

Restent volontairement hors implémentation : cadrage du niveau et des objectifs, personnalisation de l'accueil, examen professionnel des programmes, parcours 16–17 ans, comptes et récupération distante, gamification supplémentaire, retours de testeurs, offre payante et préparation du lancement.
