# Accueil et première séance

## Choix d’interface

Le premier lancement est un dialogue défilable en trois étapes : identité et pseudo facultatif, sélection explicite du programme, puis explication de la saisie. Une seule action principale dorée porte la progression. L’import demeure secondaire et le retour conserve les champs. Le guide des réglages réemploie ces écrans en lecture sans écrire le profil, le programme, l’historique ou le brouillon.

L’accueil présente successivement la salutation, le programme et sa fréquence, l’action à accomplir, la dernière séance, puis les cartes A–D ou A–C. L’action reprend un brouillon existant, démarre A avant tout historique, ou conduit au choix des séances après un premier résultat. Une séance clôturée partielle n’est jamais proposée comme brouillon ; son statut « Partielle » reste affiché dans le résumé.

## Palette et composants

Les rôles communs reposent sur `--gold-solid` et `--gold-deep`, complétés par les dorés historiques `--g` et `--g2`. Le doré identifie la marque, l’étape active, la carte sélectionnée et l’action principale. Les boutons secondaires, surfaces et textes restent neutres. Le bouton principal emploie un dégradé métallique limité avec texte presque noir afin de conserver le contraste sur sa portion claire.

Les nouveaux écrans partagent les espacements `--space-*`, le rayon `--radius-card`, la pile système existante, les cartes de programme, aides contextuelles et zones tactiles. La sélection comporte le texte « Programme sélectionné » et une coche, donc ne dépend pas de la couleur. Les thèmes sombre, clair et automatique, ainsi que la réduction d’animations, restent pilotés par les préférences existantes.

## Détection et persistance

Deux objets JSON versionnés sont autorisés dans les sauvegardes complètes :

- `hero_farm_profile_v1` : `{ version: 1, name }`, nom facultatif limité à 30 caractères ;
- `hero_farm_setup_v1` : `{ version: 1, step, completed, name, program }`, état temporaire reprenable.

Le programme actif demeure uniquement dans `aurafarm_program_mode_v1`. La finalisation vérifie les écritures avant d’ouvrir A. Elle ne crée ni journal, ni brouillon. Le marqueur historique `onb_done_v5`, un journal non vide, une séance active ou un brouillon identifient un utilisateur antérieur ; une préférence de thème seule ne le fait pas. La récupération transactionnelle est contrôlée avant toute ouverture du parcours. Les sauvegardes v4 sans profil restent valides, tandis que les nouveaux exports incluent le profil et la configuration sans inclure la copie de récupération.

Les valeurs utilisateur sont affectées avec `textContent` ou échappées avant insertion. Modifier ou supprimer le pseudo n’agit sur aucune donnée sportive.

## Aides de séance

Chaque exercice propose des aides nommées pour Charge, Répétitions et Effort. Elles expliquent les kilogrammes totaux, par haltère, le lest et l’assistance ; une assistance supérieure est explicitement décrite comme facilitant le mouvement. Leur ouverture ne reconstruit pas la séance, ne modifie aucun champ et ne touche pas au chronomètre. Sans référence, le libellé existant reste « charge à renseigner ».

## Vérifications exécutées

- `npm test` : 29 tests réussis (21 historiques et 8 nouveaux tests de persistance, compatibilité, sauvegarde et panne de stockage).
- `node --check /tmp/app.js` : syntaxe du script embarqué validée après extraction.
- `git diff --check` : aucune erreur d’espace ou de conflit.

## Limites et vérifications restantes

Aucun navigateur Chromium/Chrome ni Playwright n’était installé dans l’environnement de livraison. Aucune fausse capture n’a donc été produite. La revue visuelle et tactile reste à effectuer sur un téléphone réel à 360 et 390 px : thèmes clair/sombre/auto, clavier virtuel, focus et retour des dialogues, import annulé ou refusé, erreurs de stockage, contraste des extrémités du dégradé, alarme en séance et animations désactivées. Une largeur bureau doit également être contrôlée.
