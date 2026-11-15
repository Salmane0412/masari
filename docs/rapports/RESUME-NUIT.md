# Résumé de la nuit du 14 au 15/11/2026 (Testeur, seul)

Base testée :
- **`main` à `a1122ad`** ;
- **APK de la release `apk`** du 14/11 à 19 h 42 UTC, installé sur le téléphone ;
- **site `masari-v42`**, vérifié dans la WebView.

Tous les rapports sont sur la branche `testeur`, dans `docs/rapports/`. Rien n'a été poussé sur `main`, et `app.js`, `sw.js` et `android/` n'ont pas été modifiés.

## Tâches faites
| Tâche | Rapport | En une ligne |
|---|---|---|
| A. APK, v42, tournée complète | `2026-11-15-testeur-tournee.md` | Rotation OK. Panneau d'erreurs KO, avec un prototype de correction. Arrêt « قف » KO. 29 écrans sans erreur JS. Démarrage en 0,78 s. |
| B. Lot 2 (fonctions, confort, YouTube) | `2026-11-15-nuit-B-lot2.md` | Tâches, hors ligne, prière, finances et santé OK. Le test vocal est muet dans l'app. YouTube se lit, mais sans plein écran. |
| C. Signes de waqf | `2026-11-15-nuit-C-waqf.md` | 4 364 marques Tanzil, **0 écart** avec `data.js`, 5 signes Dar al-Ma'rifa ↔ Unicode, rendu vérifié sur le téléphone. |
| D. Horodatage mot à mot | `2026-11-15-nuit-D-horodatage.md` | Modèle local contre segments Quran.com : début médian à 80 ms, 61 % à 100 ms près ; basmala inventée en 67:1. |
| E. Banc de 30 cas | `2026-11-15-nuit-E-banc-suivi.md`, `…-E2-tolerance.md`, `…-E3-arret-qif.md` | La logique ne donne aucune fausse alerte sur texte exact, mais ne signale jamais un mot manquant et laisse passer les mots proches. 3 prototypes mesurés. |
| F. Fenêtre glissante de 8 s | `2026-11-15-nuit-F-fenetre.md` | 92 % de mots justes, mais pas de temps réel sur ce PC (6,4 s de calcul pour un pas de 2 s). |
| G. Idées | `IDEES-nuit.md` | 15 idées classées par valeur et par coût, avec leurs sources. |
| H. Disque | `2026-11-15-nuit-H-disque.md` | 2,6 Go libres. 4,2 Go d'émulateur inutile ; rien n'a été supprimé. |

Les tests du dépôt passent sur `main` : 7/7 unitaires et 16/16 cas de `follow-replay.pw.js`.

## Tâches bloquées (voir `BLOQUE.md`)
- **Blocage** : le service d'accessibilité n'est pas activé sur le téléphone, donc il n'y a rien à tester. Un redémarrage demanderait aussi ton code.
- **Compteurs d'erreurs 67:2/67:3** gonflés par les tests : à toi de dire s'il faut les remettre à zéro.
- **Batterie** : pas mesurable, le téléphone est sur le secteur.
- **QUL** : demande un compte. Ce n'est pas urgent, Quran.com a servi de référence à la place.

## Les 5 constats les plus importants
1. **Un mot oublié n'est jamais signalé** (0/6, même sur texte exact). C'est pourtant l'erreur de hifz la plus fréquente. Un prototype mesuré (« mot manquant entouré de 2 mots justes de chaque côté, hors début d'aya ») donne **6/6 sans fausse alerte**. Sur ta vraie séance Google, il **rattrape « النظر »**, que Google avait fait disparaître (rapport E).
2. **Des mots différents passent pour justes** : `wcost ≤ 0.4` accepte وهو/وهي, الذي/التي, الرحمن/الرحيم, قدير/كبير, الموت/الحوت, خلق/علق. **0/7 signalés** en injection sur le téléphone. La variante D mesurée en signale 7/7, avec 1 fausse alerte due à la graphie uthmani (rapport E2).
3. **Le panneau d'erreurs est caché** sous la barre « متوقف عند خطأ » et le bouton, en portrait comme en paysage. Le mot fautif est caché aussi. Le prototype de position fonctionne en portrait (tournée).
4. **L'arrêt « قف » coupe une récitation juste** quand Google déforme le premier mot d'une phrase (« رضيع » pour « فارجع »). La règle B mesurée supprime cette fausse alerte sans perdre aucune détection actuelle (rapport E3).
5. **Le test vocal n'émet aucun son dans l'app Android** : `speechSynthesis` est absent de la WebView. De plus, 2 mots annoncés sont ambigus pour **11,2 %** des ayas d'une même unité (rapport B).

## Ce que le chef doit corriger en premier
1. La règle « mot manquant » dans `followEval` (rapport E) : gros gain, faible coût, déjà mesurée.
2. Le panneau `#rec-out` au-dessus des barres, avec défilement jusqu'au mot fautif (prototype dans la tournée).
3. La tolérance `wcost` (variante D, plus le repli de graphie حيوة/حياة) puis l'arrêt « قف » (règle B).
4. Le test vocal : synthèse vocale native via `MasariNative`, et annonce de mots jusqu'à ce que le début soit unique.
5. `onShowCustomView` dans `MainActivity`, pour le plein écran YouTube.

## Ce que j'ai fait sur ton téléphone cette nuit (tout est réversible et a été remis en place)
- Installé l'APK de la release (`adb install -r`, mise à jour de la même app).
- Forcé la rotation pour les tests. Les réglages d'origine (rotation auto activée) sont remis en fin de nuit.
- Modifié brièvement le réglage « écran allumé en charge » (de 7 à 2), puis remis à **7**, sa valeur d'origine, une minute après.
- Créé puis supprimé des données de test (tâche, opération, comptes, prière cochée, santé). Les données Masari ont été **restaurées depuis une sauvegarde** prise avant, et l'égalité a été vérifiée octet par octet. La sauvegarde est dans `C:\masari-data\nuit\sauvegarde\`.
- **Aucun son** joué la nuit : synthèse vocale et lecteurs coupés dans la page, vidéo YouTube en muet.
- Captures prises uniquement quand Masari était au premier plan. Telegram n'a pas été ouvert.
