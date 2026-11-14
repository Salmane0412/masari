# Consignes en cours (mis à jour par le chef d'orchestre)

## Testeur (session locale) — plan mis à jour le 14/11 (après le premier rapport)
Contexte : l'émulateur est abandonné (7,4 Go requis, 4 Go libres, pas d'accélération matérielle). On teste sur le VRAI téléphone Android de l'utilisateur, branché en USB, débogage USB activé.
1. `adb devices` : vérifier que le téléphone est vu et autorisé. Sinon, dire à l'utilisateur quoi faire sur l'écran du téléphone (accepter « Autoriser le débogage USB »).
2. Installer l'APK de la release « apk » avec `adb install -r`, lancer l'application (package `app.masari.lock`), prendre des captures (`adb exec-out screencap -p`) et les relire. Vérifier que l'application charge la dernière version du site (service worker `masari-v37`).
3. Test d'écoute réelle : jouer sur les haut-parleurs du PC des fichiers Al-Husary d'everyayah (ex. https://everyayah.com/data/Husary_128kbps/067001.mp3 pour 67:1), le téléphone écoute avec son micro, dans la séance de lecture de l'unité 224 (Al-Mulk). Rejouer ensuite les cas de `tests/follow-replay.pw.js` et noter ce qui marche ou échoue (départ au milieu, répétition, basmala, erreur volontaire). Faire la même chose avec l'examen 🎓.
4. Mesurer le PC (CPU, RAM, GPU, espace libre) et tester un petit modèle de reconnaissance coranique local sur le même audio (précision, temps).
5. Écrire le rapport dans `docs/rapports/` (ce qui a été testé réellement / en simulation, mesures, ce qui demande une action de l'utilisateur).

## Données du mushaf (session locale)
1. Télécharger depuis qul.tarteel.ai : texte Madani avec waqf, horodatages Al-Husary, morphologie ; lire les licences ; convertir en JSON compact.

## Blocage Android (revue)
1. Auditer la fiabilité du blocage (arrêt du service, économiseur de batterie, autres profils, navigateurs, DNS, changement d'heure, désinstallation). Rapport privé.

## Chef d'orchestre
1. Synchronisation automatique par QR code (besoin : jeton GitHub créé par l'utilisateur).
2. Mini-livre interactif des makhârij (17 schémas + vidéos intégrées).

## Testeur — tournée complète sur le vrai téléphone (v41, 14/11 soir)
Pour chaque point : tester réellement (adb + WebView), noter OK/KO et la preuve (capture, log) dans `docs/rapports/<date>-testeur-tournee.md` sur la branche `testeur`. Ne pas toucher à `app.js`.
1. Rotation : après l'installation de l'APK reconstruit (configChanges), faire tourner le téléphone (portrait/paysage) pendant une session de suivi : la page, la position et l'écoute doivent rester. Tester aussi retour depuis une autre appli.
2. Panneau d'erreurs : pendant le suivi, le panneau (`#rec-out`) doit rester en bas sans cacher le verset ; vérifier en portrait et en paysage, thème clair et sombre.
3. Suivi : rejouer `substitution2.wav` (البصر→النظر) et la récitation avec « والعيش » : attendu = les deux signalées. Noter les fausses alertes.
4. Arrêt « قف » : vérifier qu'il ne coupe pas une récitation juste (cas « رضيع البصر » du rapport v40).
5. Pages et fonctions : parcourir chaque écran de l'app (accueil, séance, mushaf, examen 🎓, quiz, paramètres, santé, prières, tâches), relever erreurs console (`DIAG`), éléments coupés, boutons morts, textes mal alignés (RTL).
6. Blocage : vérifier que le blocage tient après redémarrage du téléphone et après fermeture forcée de l'app (sans proposer de contournement).
7. Espace disque et performances : temps de démarrage, mémoire, batterie sur 10 min de suivi.
