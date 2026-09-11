# Progrès et historique

## Fonctionnement

L’onglet **Progrès** comporte trois vues. **Exercices** recherche les variantes réellement enregistrées et affiche une mesure à la fois sur 30 jours, 90 jours ou tout l’historique. **Historique** filtre toutes les séances par programme, période et statut, puis en affiche douze à la fois avec **Afficher plus**. **Activité** conserve le résumé descriptif des séries de la semaine dans un accès secondaire.

Le bilan de séance ouvre directement l’identifiant de la séance enregistrée. Le détail permet de corriger les séries et la charge ou de supprimer la séance après une confirmation qui rappelle le programme, la lettre et la date. Après écriture réussie, les états dérivés et records existants sont reconstruits depuis le journal. En cas d’échec d’écriture, la vue conserve la saisie et affiche le message d’erreur sans annoncer un succès.

## Conventions de comparaison

- Une variante est identifiée par son `vid` stable **et son unité**. Une machine, une barre, des haltères, du lest et une assistance ne sont donc pas fusionnés.
- Chaque occurrence enregistrée reste un point distinct, y compris plusieurs occurrences le même jour ou dans la même séance. L’ordre est date, identifiant de séance, puis position dans la séance.
- La courbe montre soit la charge observée, soit le total de répétitions. Elle n’utilise ni double axe, ni interpolation lissée, ni score, ni conclusion physiologique.
- Pour une assistance, une valeur plus basse signifie moins d’aide. Un exercice au poids du corps ne propose que les répétitions.
- Le statut complet ou partiel, le nombre de séries, l’effort et le programme source accompagnent chaque valeur. Le total de répétitions dépend du nombre de séries.
- Les filtres utilisent le début du jour local pour inclure exactement la limite de 30 ou 90 jours. Leur consultation ne modifie aucune donnée sportive.

## Données manquantes et anciennes

Une charge absente ne devient jamais zéro et coupe la courbe de charge. Les vrais zéros de lest et d’assistance sont conservés. Les emplacements vides des séries détaillées restent visibles sous la forme `—`. Un ancien résultat uniquement agrégé affiche **Détail des séries indisponible** : aucune répartition n’est inventée.

Les vues sont calculées à partir de `paogramme_log_v2`; aucun deuxième historique n’est créé. Les variantes retirées du programme restent consultables tant qu’elles figurent dans ce journal. Une sauvegarde ancienne n’a besoin d’aucun état d’interface supplémentaire.

## Vérifications exécutées

- `node --test test/hero-farm-core.test.js` : 46 tests réussis, dont les 34 tests antérieurs et 12 scénarios ciblés (variantes, zéros, données manquantes, limites locales, pagination sur 350 séances, correction, suppression, panne d’écriture et absence de mutation à la consultation).
- `node --check hero-farm-core.js` et contrôle syntaxique du script extrait de `index.html` : réussis.
- `git diff --check` : réussi.

## Limites et vérification visuelle

Aucun navigateur n’est installé dans l’environnement de livraison. L’installation de Playwright est bloquée par une réponse HTTP 403 du registre npm. Les captures réelles n’ont donc pas pu être produites et la livraison **n’est pas présentée comme validée visuellement sur téléphone réel**.

Procédure exacte à exécuter sur une machine avec Chrome/Chromium :

1. Servir le dépôt avec `python3 -m http.server 4173` puis ouvrir `http://localhost:4173`.
2. Enregistrer plusieurs séances (ou restaurer une sauvegarde de test), dont une partielle, une avec assistance à zéro et deux occurrences d’une même variante le même jour.
3. Dans les outils de développement, tester 360 × 800 et 390 × 844, puis une largeur de bureau (au moins 1280 px).
4. Capturer **Progrès > Exercices**, **Progrès > Historique** et un **détail de séance**, une fois en thème clair puis sombre.
5. Vérifier au clavier les onglets, filtres, points SVG, liste équivalente, retour de détail, correction et confirmation de suppression; vérifier l’absence de débordement horizontal.
6. Depuis l’accueil, ouvrir une séance guidée, l’enregistrer, utiliser **Voir le détail**, puis vérifier que le bon identifiant s’ouvre même après avoir appliqué des filtres incompatibles.
7. Répéter les étapes critiques sur un téléphone réel avec thème automatique et réduction des animations activée.
