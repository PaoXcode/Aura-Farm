# Étape 4 — séance guidée et bilan

## Comportements livrés

La **Vue guidée** reste optionnelle : la vue d’ensemble demeure le point d’entrée. Un exercice peut être ouvert depuis sa carte, y compris pour le corriger. La vue guidée édite les champs de la carte (charge commune, emplacements de séries et effort) et sauvegarde le même brouillon et le même identifiant de séance.

L’écran suit l’ordre consignes/référence, objectif et charge réellement utilisée, séries, effort puis action. Une charge suggérée n’est plus injectée dans le champ de résultat : elle reste un objectif. En l’absence de référence, le champ est vide et annoncé « Charge à renseigner ». Chaque série est stockée à sa position ; une série 3 ne glisse donc plus en série 2. Le total est dérivé des seules valeurs valides.

**Valider l’exercice** applique les validateurs et la progression existants. L’échec laisse les records et la progression inchangés et affiche le message dans la zone d’erreur guidée. Après succès, la recommandation et « Pourquoi ? » apparaissent, puis **Exercice suivant** reste une action explicite. Les rappels techniques conservent leur note, sans progression artificielle.

Le moteur de repos existant est réutilisé. Le lancement reste explicite. À l’expiration, il met à jour le chronomètre et annonce le prochain emplacement, mais ne reconstruit plus la vue guidée : il ne remplit aucune répétition et ne vole pas le focus. Pause, reprise, ±15 s, remise à zéro, vue compacte, son et fermeture restent les commandes existantes. L’avertissement « garde l’app ouverte » est conservé.

Un changement de variante après saisie passe toujours par la confirmation existante. Après choix, les saisies de cette position sont effacées explicitement et aucune charge n’est convertie ou réattribuée à la nouvelle variante. L’ancien résultat persiste seulement dans le brouillon associé avant le choix, sans devenir l’historique de la nouvelle variante.

## Brouillons et compatibilité

Le brouillon enrichi porte `version: 2` et une navigation `{ view, sid }`. Les brouillons sans version et les anciens tableaux restent lisibles. `setReps` accepte désormais des emplacements `null` dans les brouillons et séances partielles ; aucune répétition n’est inventée. Les anciens totaux agrégés gardent leur comportement historique. L’identifiant et la base de progression sont restaurés comme auparavant. L’état du chronomètre demeure dans sa clé dédiée et conserve ses règles de reprise.

## Bilan enregistré

La clôture refuse une séance vide et conserve alors le brouillon. Après écriture confirmée, le bilan est construit depuis l’entrée relue dans l’historique, et non depuis le formulaire. Il indique :

- séance complète ou partielle ;
- programme, lettre et date ;
- exercices entièrement et partiellement renseignés ;
- séries réellement effectuées, sans pondération musculaire ;
- retour à l’accueil ou accès au détail dans Stats.

La déduplication reste fondée sur l’identifiant de séance. Un échec de stockage n’ouvre aucun faux bilan et conserve le brouillon.

## Vérifications automatisées

- `node --test test/hero-farm-core.test.js`
- `npm test`
- extraction du JavaScript embarqué puis `node --check /tmp/hf-inline.js`
- `git diff --check`

Les tests ciblent notamment les trous de séries, les bilans complet/partiel/vide, la correction de charge, les entrées invalides et la déduplication.

## Revue visuelle et captures

Aucun navigateur exécutable n’est installé dans l’environnement (`chromium`, Chrome, Firefox et WebKit absents). Une tentative d’installation locale de Playwright a été refusée par le registre npm avec HTTP 403. **Aucune capture prétendument réelle n’a donc été fabriquée** ; `docs/captures/etape-4/` reste volontairement vide.

Procédure à exécuter dès qu’un navigateur est disponible :

1. servir le dépôt avec `python3 -m http.server 8080` ;
2. ouvrir `http://127.0.0.1:8080`, terminer le guide, puis démarrer Musculation A ;
3. avec les DevTools en 360×800 puis 390×844, capturer en sombre : vue guidée renseignée, repos compact et erreur de série intermédiaire ;
4. terminer une séance partielle et capturer le bilan en clair à 390×844 ;
5. capturer l’accueil clair et sombre (captures manquantes de l’étape 3) ;
6. répéter à 1440 px, en thème Auto et avec « Animations premium » désactivé ; contrôler `document.documentElement.scrollWidth === document.documentElement.clientWidth` ;
7. mesurer avec l’outil contraste les textes sur les deux extrêmes du dégradé doré et vérifier le focus clavier après chaque fenêtre ;
8. enregistrer les fichiers dans `docs/captures/etape-4/` sans retouche fonctionnelle.

## Essais restant obligatoires sur téléphone réel

Tester iOS Safari et Android Chrome à 360/390 px : clavier virtuel, zones tactiles, retour du focus après les fenêtres, chronomètre pendant saisie et alarmes avec application ouverte. Vérifier explicitement qu’aucune promesse sonore n’est faite écran verrouillé. Cette livraison et ses tests automatisés ne suffisent pas à déclarer l’application prête à commercialiser.
