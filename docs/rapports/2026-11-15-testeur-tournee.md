# Tournée complète sur le vrai téléphone : v42 (nuit du 15/11/2026, 00 h 40 – 01 h 10)

## Base testée (vérifiée)
- APK de la release `apk` publiée le 14/11 à 19 h 42 UTC, après le commit `91c28e0` (configChanges). Téléchargé dans `C:\masari-data\apk-2026-11-15\`, installé par `adb install -r` : Success.
- App fermée puis rouverte : cache **`masari-v42`**, `MasariNative.version() = "2.3"`.

## Méthode
- **Débogage de la WebView** (CDP) par `adb forward`.
- **Phrases reconnues injectées** par le crochet natif `window.__nsr_ev('result', texte, true)`. C'est exactement le chemin qu'emprunte `SpeechBridge`, mais sans micro : l'audio n'a pas été joué pendant la nuit.
- **Captures** prises seulement quand Masari est au premier plan (vérifié par `dumpsys activity`).
- **Rotation** forcée par `settings put system user_rotation`. Valeurs d'origine relevées : `accelerometer_rotation=1`, `user_rotation=0`. Elles sont remises en fin de nuit.

| # | Point | Résultat | Preuve |
|---|---|---|---|
| 1 | Rotation pendant le suivi | **OK** | 5 rotations (0, 1, 0, 3, 0) en pleine séance : `performance.now()` croît sans retomber, donc pas de rechargement ; `fol.on` reste vrai et l'écoute continue. Après injection de 67:1–2 (p = 17), 2 rotations puis Accueil Android et retour : toujours p = 17 et 17 mots justes. Captures `01-…`, `02-suivi-apres-rotation.png`. |
| 2 | Panneau d'erreurs (`#rec-out`) | **KO** | Testé en portrait et en paysage, en clair et en sombre (`emulate_media`). Résultat identique partout : le texte du panneau (« توقّف. أخطأتَ عند «البصر»… ») est **recouvert par la barre « ⏸ متوقف عند خطأ »**, et seul son liseré orange dépasse. Le **mot fautif est sous le panneau** (`cacheParPanneau: true` dans les 4 cas). En paysage, panneau et barres prennent environ 60 % de la hauteur (384 px) et les ayas 67:3 et suivantes sont cachées. Captures `panneau-*.png`, `03-substitution-nadhar.png`. |
| 3a | Suivi : « والعيش » ajouté en 67:2 (vraie transcription Google du 14/11) | **OK** | Signalé : « 67:2 والحيواه » (le mot juste qui précède l'ajout est marqué), sans fausse alerte, 85 mots justes. En v40, il n'était pas signalé. |
| 3b | Suivi : « البصر » → « النظر » (67:3) | **OK sur texte propre, KO sur la vraie séance** | Texte propre « فارجع النظر… » : **signalé** (67:3 البصر), avec arrêt « قف ». Vraie transcription Google de la séance : **non signalé**, car Google a supprimé le mot ; aucune logique ne peut le retrouver. Transcription du modèle local (« المظر ») : signalé, mais avec **2 fausses alertes** (67:3 « خلق », 67:5 « وجعلناها ») dues à des mots mal entendus par le modèle. |
| 4 | Arrêt « قف » sur une récitation juste (cas « رضيع البصر ») | **KO** | Avec `stopOnErr = true`, la séance est **arrêtée en 67:3 sur « فارجع »** alors que la récitation est juste : Google a entendu « رضيع ». Journal : `halt expected=فارجع idx=32`. |
| 5 | Pages et fonctions (29 routes) | **OK, avec 2 remarques** | 0 erreur JS ou promesse rejetée, 0 débordement horizontal (`scrollWidth = 432 = innerWidth`), 0 texte arabe hors RTL. Remarques : cibles tactiles trop petites, « اختر اختبارًا » dans `#/quiz` (54×26 px) et les « × » de `#/career` (29×36 px), sous les 44 px recommandés. Les puces de `#/tasks` débordent volontairement (ligne défilante). Captures `tour-portrait-sombre-*.png`, détail dans `tour-portrait-sombre.json`. |
| 6 | Blocage après redémarrage ou fermeture forcée | **BLOQUÉ** | Le service d'accessibilité n'est pas activé sur ce téléphone (`accessibility:false`, `enabled_accessibility_services = null`) : voir `BLOQUE.md`. |
| 7 | Démarrage, mémoire, batterie (10 min de suivi) | **Mesuré** | Démarrage à froid (`am start -W`, 3 essais) : **783 / 789 / 785 ms**. Mémoire PSS **143 Mo au début, 126 Mo après 10 min**, pas de fuite. CPU relevé chaque minute par `top` : Masari 0–10 %, service Google de reconnaissance 3–10 %. **148 redémarrages de la reconnaissance en 10 min** (`no-speech`, soit environ toutes les 4 s, au calme). Température 41,5 °C puis 42,0 °C. Batterie non mesurable : téléphone sur le secteur (70 % puis 75 %). |

## Ce que le chef devrait corriger en premier
1. **Panneau d'erreurs** :
   - placer `#rec-out` au-dessus de la barre « متوقف عند خطأ », ou les fusionner en un seul bloc ;
   - faire défiler pour que le mot fautif soit visible **au-dessus** du panneau ;
   - en paysage, réduire la hauteur des barres.
2. **Arrêt « قف »** : ne pas s'arrêter sur un seul mot mal reconnu en début de phrase. Par exemple, attendre 2 mots faux consécutifs, ou un résultat final qui confirme l'erreur.
3. **Substitution perdue par Google** : seule une seconde passe audio (modèle local) peut la rattraper. Voir les rapports E et F.

## Pas testé
- Le micro réel cette nuit (pas d'audio à pleine puissance la nuit). Les phrases injectées sont de vraies transcriptions Google du 14/11, ou des transcriptions du modèle local.
- Le blocage (voir `BLOQUE.md`).
- La batterie sans chargeur.
