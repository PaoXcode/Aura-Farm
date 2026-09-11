# Fiabilisation de HERO FARM

## Référence et portée

La première étape partait de `68712b14968e948a14fffba362ed13c03814e63d`. Cette seconde étape part du commit revu `dbc543b` (qui intègre `ef71b44`) et corrige les cinq défauts confirmés après la PR 44. Elle **ne valide pas professionnellement les programmes** et ne suffit pas à déclarer l'application prête à commercialiser.

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

La restauration valide désormais la structure métier avant d'écrire : liste et séances du journal, identifiants sûrs, dates, items, séries et total cohérents, charges, effort, brouillon, programme, préférences, références et états. Les formes ou domaines inconnus sont refusés sans mutation. Une copie durable `paogramme_recovery_backup_v1` est écrite **et vérifiée en premier** ; elle n'est jamais incluse dans un export, afin d'éviter les sauvegardes récursives. Elle n'est supprimée qu'après vérification de toutes les écritures ou après une récupération vérifiée.

En cas de panne ponctuelle, l'ancien état est réécrit et vérifié. En cas de panne persistante, la copie durable reste disponible. Au démarrage, sa présence interrompt le démarrage normal et propose soit de rétablir les anciennes données, soit d'exporter la copie ; une copie illisible bloque également le démarrage silencieux. Le message de restauration distingue état rétabli, copie disponible et état non vérifié. Le chronomètre conserve son échéance sérialisée : la restauration ne joue aucun son et son code normal de reprise décide ensuite si l'échéance est passée.

### Migration v3 et limites historiques

Les véritables exports `v3` (`programMode`, `log`, `cfg`, groupes `last`, `state`, `rp10`) sont aplatis vers v4. Les préférences, records, brouillon et états du chronomètre absents d'un ancien fichier restent absents : aucun résultat sportif n'est inventé. Les anciens journaux explicitement marqués `legacyAggregate` conservent leur total et, lorsque `performedSets` existe, ce compte factuel. Sans `performedSets`, leur complétude reste inconnue : ils alimentent les faits disponibles, mais pas la progression. Aucune répartition série par série n'est inventée.

## Cycle de séance et états dérivés

- Un `sessionId` naît à l'ouverture, vit dans le brouillon et est repris après rechargement. Le brouillon contient aussi la base de progression de début de séance.
- « Terminer / Enregistrer » exige une charge valide dès qu'une série pondérée est réalisée, cible et focalise le champ fautif, et conserve le brouillon. Un exercice entièrement vide ne bloque pas une clôture partielle ; poids du corps, lest nul et assistance nulle gardent leurs règles distinctes. Après validation, le journal est écrit puis le brouillon supprimé. L'overlay de succès ne s'ouvre qu'après réussite.
- La complétude est calculée exercice par exercice à partir du nombre de séries réellement réalisées. Un exercice interrompu conserve ses séries, répétitions et records factuels, mais ne modifie ni échec, ni décharge, ni recommandation. Un exercice terminé dans une séance globalement partielle suit normalement la progression. Une charge historique inconnue reste `null` et exclut les calculs qui en dépendent : elle ne devient jamais zéro.
- L'édition d'une séance détaillée affiche les répétitions série par série. Un enregistrement inchangé ou une modification de charge conserve le tableau ; une modification des séries recalcule le total. Retirer le détail d'une séance moderne est une suppression explicite, distincte d'un agrégat historique.
- Après édition, suppression ou import, les états `last_`, `state_` et `records_` sont effacés puis rejoués dans l'ordre `(timestamp, id)`. Le recalcul est déterministe et retire les records fantômes. L'e1RM est désactivé : le total de répétitions d'un exercice n'est jamais passé à une formule de série.
- La « dernière séance » est filtrée par lettre **et programme**. L'objectif sur quatre semaines utilise le programme courant (Musculation 4/semaine, Hybride 3/semaine) ; c'est la convention affichée pour une période traversant un changement. Les séries pondérées et la fatigue sont présentées comme estimations issues du journal, sans portée médicale. La durée affichée est une estimation planifiée et non une mesure réelle.
- Le CSV conserve sa fusion par séance datée à la minute. Réimporter le même export ignore les clés déjà présentes au lieu d'ajouter silencieusement un doublon.

## Vérifications ciblées

Commandes exécutées lors de l'étape 2 :

- `npm test` : 21 tests Node réussis. Les tests appellent les fonctions du noyau réellement utilisées par l'interface pour la clôture, la complétude, l'édition, la validation et la transaction de restauration. Ils couvrent notamment panne ponctuelle/persistante, échec de la première écriture, redémarrages simulés après chaque phase, charge manquante puis corrigée, trois exercices partiels et trois complets, trois formes d'édition, agrégat ancien, sauvegardes invalides sans mutation et répétition déterministe.
- `node --check hero-farm-core.js` et extraction du script de `index.html` suivie de `node --check /tmp/index-inline.js` : syntaxe validée.
- `git diff --check` : contrôle des espaces et marqueurs de conflit.

Les contrôles de stockage et d'intégration sont simulés avec une implémentation synchrone fidèle à l'API Web Storage. Aucun navigateur graphique n'était disponible dans l'environnement pour automatiser le parcours visuel mobile.

Restent donc à contrôler sur appareil réel : démarrage avec/sans récupération, saisie normale et Focus, clôture partielle, historique/édition/suppression et restauration, à largeur mobile, ainsi que le chronomètre et son comportement écran verrouillé. L'avertissement « Pour entendre l'alarme, garde l'app ouverte » est conservé. Les tests Node ne prouvent ni le rendu tactile, ni le téléchargement sur chaque navigateur mobile, ni le son écran verrouillé.

## Backlog hors chantier

Restent volontairement hors implémentation : cadrage du niveau et des objectifs, personnalisation de l'accueil, examen professionnel des programmes, parcours 16–17 ans, comptes et récupération distante, gamification supplémentaire, retours de testeurs, offre payante et préparation du lancement.
