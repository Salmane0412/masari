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
