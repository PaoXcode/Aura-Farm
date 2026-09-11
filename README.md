# HERO FARM

Application d'entraînement statique : ouvrir `index.html` depuis un serveur HTTP local.

```bash
python3 -m http.server 8000
npm test
```

## Recette navigateur isolée

Les cinq sauvegardes fictives de l'étape 6 peuvent être matérialisées hors du
code applicatif avec `npm run fixtures:browser`. La recette automatisée se lance
avec `npm run test:browser` lorsqu'un Chromium Playwright est déjà disponible.
Elle sert elle-même l'application en local et utilise un contexte neuf par
scénario ; elle ne vise jamais le site de production.

Le protocole, les limites et la vérification sur téléphone sont détaillés dans
[`docs/recette-mobile-finitions.md`](docs/recette-mobile-finitions.md) et
[`docs/verification-telephone.md`](docs/verification-telephone.md).

Le schéma de sauvegarde et le rapport de fiabilisation sont documentés dans
[`docs/fiabilisation-hero-farm.md`](docs/fiabilisation-hero-farm.md).

## Documentation fonctionnelle

- [Progrès et historique](docs/progres-historique.md)
