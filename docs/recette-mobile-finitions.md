# Étape 6 — recette mobile et finitions

## État de la vérification

- **Version de départ :** `0029f76` (après PR 48).
- **Version testée par les tests Node :** `d09651c` (contenu fonctionnel identique au commit final ; seul ce repère documentaire a ensuite été actualisé).
- **Environnement :** Linux, Node 24.15.0, aucun navigateur exécutable détecté.
- **Tentative de disponibilité :** `chromium`, `chromium-browser`, Chrome et
  Firefox absents ; aucun Playwright, Puppeteer ou Selenium local. Une requête de
  métadonnées `npm view @playwright/test version --json` a reçu HTTP 403. Aucune
  installation n'a donc été relancée et aucune restriction n'a été contournée.
- **Validation visuelle :** **Non exécuté**. Le dossier de captures est
  volontairement vide : aucune image reconstituée ne remplace un navigateur.
- **Téléphone réel :** **Non exécuté**. Une émulation de viewport, lorsqu'elle
  sera disponible, ne vaudra pas essai Safari/Chrome sur appareil.

## Matériel de recette reproductible

1. `npm test` valide le noyau et les cinq fixtures.
2. `npm run fixtures:browser` écrit cinq sauvegardes JSON dans
   `tmp/recette-fixtures/`, dossier non utilisé au démarrage normal.
3. Si Playwright et son Chromium sont fournis par l'environnement :
   `npm run test:browser`. Le script démarre un serveur HTTP local, crée un
   contexte isolé par état et écrit les preuves ainsi qu'un `manifest.json`
   (commit, moteur et version) dans `docs/captures/etape-6/`.
4. Si la dépendance n'est pas fournie et que l'accès est autorisé :
   `npm install -D playwright && npx playwright install chromium`, puis relancer
   la commande. Cette installation n'a pas été possible dans l'environnement
   examiné.

Les fixtures sont déterministes, fictives et compatibles avec le validateur v4 :

| Fixture | Usage |
| --- | --- |
| `newUser` | stockage vierge, découverte et choix explicite |
| `existingStrength` | profil Musculation et plusieurs séances complètes |
| `hybridDraft` | séance Hybride partielle et brouillon guidé reprenable |
| `legacyEdges` | assistance à zéro, charge ancienne absente, agrégat ancien, série intermédiaire vide, deux occurrences le même jour |
| `pagination` | quinze séances, filtres et accès au-delà de la douzième |

## Journal des parcours

Les statuts ci-dessous distinguent expressément tests de fonction, revue de code
et parcours navigateur.

| Parcours | Version / environnement | Statut | Résultat, défauts et preuves |
| --- | --- | --- | --- |
| A. Découverte / première séance | `0029f76` + patch, revue et tests Node | **Non exécuté** (navigateur) | Fixture vierge et profil existant prêts. La revue confirme la persistance versionnée ; aucune preuve d'interaction réelle. |
| B. Séance guidée / repos / reprise | idem | **Non exécuté** (navigateur) | Script préparé pour saisie, erreur et chrono. Contrôle tactile, expiration pendant clavier et rechargement restent ouverts. |
| C. Clôture / bilan / historique | idem | **Corrigé et revérifié** (fonction) | Un brouillon avec `repsTot:null`, réellement produit avant saisie, était refusé par l'export/restauration. Le validateur accepte désormais ce vide explicite ; test de régression ajouté. Double-clic, édition et suppression restent couverts par le noyau. Aucun parcours visuel exécuté. |
| D. Progrès / pagination | idem | **Vérifié** (fonction seulement) | Zéro réel, valeur manquante, agrégat, emplacement vide, occurrences le même jour et page 13 sont exercés par fixtures/tests. Toucher du graphe et rendu restent **Non exécuté**. |
| E. Sauvegarde / erreurs | idem | **Vérifié** (fonction seulement) | Validation/restauration, import invalide et récupération persistante restent couverts. Messages et téléchargement réels restent **Non exécuté**. |
| Mobile 360×800 / 390×844 / bureau | aucun moteur | **Non exécuté** | La recette est paramétrée aux trois tailles. Clavier virtuel et téléphone réel restent requis. |
| Clair / sombre / automatique | revue CSS | **Corrigé et revérifié** (revue) | Zoom utilisateur rétabli, focus visible, champs à 16 px, cibles fréquentes à 44 px, safe-area du chrono et réduction de mouvement système ajoutés. Contrastes sur pixels réels : **Non exécuté**. |

## Défauts constatés

| Scénario | Observé | Attendu | Écran / correction |
| --- | --- | --- | --- |
| Export d'une séance ouverte avant toute répétition | `repsTot:null` était produit par le brouillon mais rejeté par le validateur de sauvegarde. | Un brouillon vide valide doit pouvoir être exporté et restauré. | Sauvegarde ; condition de validation corrigée et testée. |
| Restauration d'un ancien total agrégé | Un item marqué `legacyAggregate` avec total et sans détail de séries était reconnu par les calculs, mais refusé par le validateur. | Le format ancien explicitement marqué doit rester restaurable sans inventer les séries. | Sauvegarde/historique ; exception de cohérence limitée aux agrégats explicites et testée. |
| Agrandissement du texte sur mobile | La meta viewport interdisait zoom et mise à l'échelle. | Les informations importantes doivent rester agrandissables. | Tous écrans ; verrou de zoom supprimé. |
| Navigation clavier | Plusieurs contrôles n'avaient pas de repère de focus partagé. | Un focus fortement visible en clair et sombre. | Tous écrans ; anneau doré commun ajouté. |
| Commandes fréquentes et chrono | Plusieurs boutons et pastilles de série mesuraient moins de 44 px. | Cible tactile d'au moins 44×44 px. | Séance/chrono/réglages ; minimum commun et pastilles agrandies. |
| Réduction des mouvements | Le réglage interne fonctionnait, mais le média système n'était pas appliqué directement. | `prefers-reduced-motion` doit neutraliser reflets et transitions sans perdre les repères. | Tous écrans ; règle système ajoutée. |

## Contrôles encore ouverts

- Toutes les captures demandées, les comparaisons clair/sombre et les mesures de
  contraste sur les dégradés réels.
- Focus rendu au déclencheur après chaque fenêtre, piège de focus complet et
  comportement avec lecteur d'écran.
- Clavier virtuel, safe areas réelles, zoom texte et absence de saut de mise en
  page sur iOS Safari et Android Chrome.
- Parcours de panne depuis l'interface et exactitude visuelle des messages.

Ces points ne sont pas déclarés validés par les 51 tests Node : les 46 tests
existants et 5 tests ciblés sur les fixtures et les formats anciens.
L'étape ne valide ni les programmes sportifs, ni la gamification, ni la
préparation commerciale.
