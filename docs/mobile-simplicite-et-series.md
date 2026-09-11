# Étape 7 — simplicité mobile et séries

## Version et périmètre

La réalisation part du commit `7ea8619`. Elle conserve le noyau métier, les deux programmes, les variantes, les historiques, les sauvegardes et les brouillons. Aucun moteur de recommandation sportive ni format de données n'a été ajouté.

## Parcours visible et accès secondaires

- Sur téléphone, la navigation comporte **Entraînement**, **Progrès** et **Réglages** dans une barre basse qui réserve la zone sûre.
- L'accueil met en premier la reprise, ou la séance A avant tout historique. Les autres séances et le dernier résultat restent compacts.
- La première utilisation affiche directement les deux programmes, fréquence, description, détail dépliable et **Commencer**. Le prénom est facultatif et la restauration reste sur cet écran.
- Une séance ouverte sur téléphone arrive dans la vue guidée, sauf si le brouillon a mémorisé la vue d'ensemble. **Accueil** et **Tous les exercices** restent explicites.
- L'exercice guidé présente prescription, recommandation, charge réellement utilisée, séries, effort et validation sans total technique visible.

Les changements de programme, charges de référence RP10, historique, export, sauvegarde, restauration et guide sont regroupés dans **Réglages**. Le chronomètre conserve son moteur et son lancement explicite.

| Ancien accès | Nouvel accès |
| --- | --- |
| Séances | Entraînement |
| Objectifs | Réglages → Charges de référence (RP10) |
| Progrès / Historique | Progrès, ou Réglages → Historique |
| Roue dentée | Destination Réglages sur mobile |
| Guide obligatoire en trois étapes | Réglages → Revoir le guide (facultatif) |
| Sauvegardes dans Progrès | Réglages → Programme et données |

## Correctif de surbrillance

`syncFocusSetRows` est l'unique synchronisation visuelle des lignes existantes. Elle consulte d'abord le champ réellement focalisé, sinon choisit la première valeur qui ne passe pas `HFCore.validateReps`. Lorsque toutes les valeurs sont valides, aucune ligne n'est active. Elle met à jour sur place classe, `aria-current`, `aria-invalid`, état et libellé : le corps guidé n'est pas reconstruit pendant une frappe, un focus, une sortie ou une fin de repos.

Les états sont : vide **À renseigner**, entier positif valide **✓ Renseignée**, valeur non vide invalide **À corriger**. La bordure gauche transparente est réservée dans le style normal afin que le repère doré ne décale pas les colonnes.

## Vérifications et limites

- `npm test` : 51 tests de noyau et fixtures réussis.
- `node --check /tmp/hf-inline.js` : syntaxe du script intégré valide après extraction.
- `git diff --check` : aucune erreur d'espace.
- `npm run test:browser` : scénario préparé mais non exécuté, car Playwright et aucun navigateur système ne sont disponibles.

Le scénario navigateur contrôle `window.innerWidth`/`innerHeight`, le choix et la persistance du programme, la saisie caractère par caractère de `11`, et la classe DOM active après sortie puis lancement du repos. Les fixtures ne sont injectées qu'une fois par contexte ; un rechargement relit ensuite le stockage produit par l'application.

Le script produit dans `docs/captures/etape-7` les écrans clair/sombre à 360 × 800, 390 × 844 et bureau, ainsi qu'une séquence série 1 → série 2 → série 3 → correction. Aucune image n'est jointe puisque le navigateur manque : exécuter `npm run test:browser` dans la recette équipée de Playwright. Une capture émulée n'est pas un test sur téléphone réel.

Restent ouverts : Safari iOS et Chrome Android physiques, clavier logiciel en petite hauteur et paysage, lecteur d'écran, agrandissement du texte, alarme après verrouillage et observation d'une personne découvrant l'application. Aucun retour testeur n'est inventé.
