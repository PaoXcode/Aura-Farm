# Contrôle téléphone — environ dix minutes

Faire un premier passage sur **un appareil disponible** suffit pour documenter
un essai. Noter modèle, OS, navigateur/version, thème, zoom du texte et commit.
Safari iPhone et Chrome Android sont souhaitables à terme, mais ne sont pas tous
deux exigés pour le premier retour.

## Avant de commencer (1 min)

1. Sur un ordinateur du même réseau, servir le commit :
   `python3 -m http.server 8000 --bind 0.0.0.0`.
2. Ouvrir l'adresse locale sur le téléphone, jamais la production.
3. Utiliser un profil/navigation privée ou un stockage de test. Importer au
   besoin une fixture produite par `npm run fixtures:browser`.
4. Vérifier qu'aucun nom réel ni secret ne figurera dans une capture.

## Parcours rapide (8 min)

- **Découverte (1 min) :** stockage vierge, ouvrir le détail des deux programmes,
  choisir explicitement un programme puis commencer directement la séance A.
  Vérifier que le prénom reste facultatif et que la restauration est visible.
- **Saisie et clavier (2 min) :** ouvrir A en vue guidée ; saisir charge et séries,
  dont une série centrale laissée vide. Vérifier que le clavier ne masque ni le
  champ ni l'action, que le zoom ne se déclenche pas seul et que le passage vers
  « Tous les exercices » conserve exactement les valeurs.
- **Repos (1 min) :** lancer, pause, reprise ; continuer à saisir jusqu'à
  expiration. Le focus, le texte et les séries ne doivent pas changer seuls.
- **Fermeture/reprise (1 min) :** fermer la vue guidée, revenir à l'accueil,
  recharger puis reprendre. Comparer identifiant, variante, emplacements vides,
  charge et effort.
- **Clôture (1 min) :** provoquer puis corriger une erreur, enregistrer une
  séance partielle et toucher deux fois l'action. Le bilan doit compter les
  exercices/séries réels et l'historique ne doit contenir qu'une entrée.
- **Historique/progrès (1 min) :** filtrer, afficher plus de douze séances, ouvrir
  un détail, revenir, sélectionner une mesure et toucher un point de courbe.
  Aucun contrôle ne doit déborder ou perdre son focus visible.
- **Sauvegarde (1 min) :** exporter, restaurer dans un second contexte privé,
  comparer profil/réglages/brouillon ; tenter un JSON invalide et confirmer
  l'absence de mutation.

## Finitions (1 min)

Basculer clair, sombre puis Auto ; activer la réduction des animations système et
agrandir une fois le texte navigateur/système. Contrôler doré identifiable,
contraste des textes, une seule action dominante, actions destructives séparées,
fenêtres défilables et zones tactiles confortables. Refaire au minimum la saisie
avec le clavier dans chaque thème.

## Compte rendu minimal

Pour chaque anomalie : scénario, résultat observé, résultat attendu, écran,
appareil et capture/vidéo éventuelle. Employer uniquement **Vérifié**, **Corrigé
et revérifié**, **Échec restant** ou **Non exécuté** et préciser s'il s'agit d'un
test de fonction, d'un navigateur émulé ou d'un téléphone réel.

## Essai sans explication préalable

Utiliser un profil isolé et ne donner au participant ni tutoriel ni indication
gestuelle. Noter mot pour mot ses hésitations ou erreurs pour choisir un
programme, démarrer, puis retrouver **Entraînement**, **Progrès**, **Réglages**,
les charges de référence, la sauvegarde et l'aide. Ne rien inventer si aucun
participant n'est disponible.

Demander ensuite de saisir `11` dans les séries 1 et 2, lancer le repos, toucher
la série 3 puis corriger la série 1. Mettre l'application en arrière-plan pendant
le repos et vérifier au retour valeur, focus, série active et message de fin.
Tester l'écran verrouillé séparément sans présumer que le son fonctionne.

Consigner appareil, OS, navigateur, tailles retournées par `window.innerWidth`
et `window.innerHeight`, thème, réduction des animations et présence du clavier.
Une émulation Playwright doit rester libellée comme telle et ne remplace pas cet
essai physique.
