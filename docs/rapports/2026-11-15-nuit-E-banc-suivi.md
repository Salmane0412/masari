# Nuit — E. Banc d'essai du suivi : 30 cas, version en ligne v42 (15/11/2026, ~01 h 40)

## Méthode (testée réellement)
- **28 cas Al-Husary** construits en coupant l'audio d'everyayah (sourate 67) aux limites de mots publiées par Quran.com :
  - parfaits ;
  - mot manquant ;
  - substitution par un vrai mot prononcé ailleurs ;
  - ajout ;
  - reprise ;
  - aya sautée ;
  - départ au milieu ;
  - bruit coloré à 10 et 3 dB de rapport signal/bruit.
- **2 cas sur la voix de Salmane** : l'enregistrement « والعيش » ajouté, et la substitution البصر → النظر.
- **Script** : `C:\masari-data\nuit\scripts\banc_build.py`. **Audio** : `C:\masari-data\nuit\banc\`.
- **Chaîne réelle** :
  1. le modèle Coran local transcrit chaque cas (VAD, sans contexte) ;
  2. chaque phrase est injectée dans **Masari en ligne sur le téléphone** (`masari-v42`), par le crochet natif `__nsr_ev`, comme le ferait `SpeechBridge` ;
  3. les mots marqués « faux » sont relevés.
- **Contrôle « logique seule »** : les 28 cas Al-Husary sont rejoués en **texte idéal**, c'est-à-dire exactement ce qui est récité, une phrase par aya.
- **Notation** : une erreur est détectée si un mot est marqué dans la même aya, à ±1 mot près. Tout autre mot marqué est une fausse alerte.

## Résultats
| Catégorie | Cas | Erreurs voulues | Détectées (audio → modèle local → Masari) | Détectées (texte idéal → Masari) | Fausses alertes (audio) | Fausses alertes (texte idéal) |
|---|---|---|---|---|---|---|
| Parfait | 3 | 0 | – | – | 4 | 0 |
| Mot manquant | 6 | 6 | **0** | **0** | 6 | 0 |
| Substitution | 6 | 6 | 4 | **5** | 4 | 0 |
| Ajout | 2 | 2 | 1 | **2** | 0 | 0 |
| Reprise | 4 | 0 | – | – | 6 | **0** |
| Aya sautée | 2 | 2 | 1 | **0** | 1 | 0 |
| Départ au milieu | 2 | 0 | – | – | 3 | 0 |
| Bruit (10 / 3 dB) | 3 | 1 | 0 | 1 | 1 | 0 |
| Voix de Salmane | 2 | 2 | 2 | (voir v40) | 4 | – |
| **Total** | **30** | **19** | **8 (42 %)** | **8 / 17 Al-Husary (47 %)** | **29** (10 cas sur 30 sans fausse alerte) | **0** |

Le cas 14 a été renoté à la main : l'index attendu était faux, car le suivi ne compte pas la basmala de 67:1. Une fois corrigé, l'erreur est bien détectée.

## Constats
1. **Sur un texte exact, la logique v42 ne donne aucune fausse alerte** : 28 cas, dont les reprises, les départs au milieu et le cas « aya sautée ». Elle détecte bien les substitutions (5/6) et les ajouts (2/2).
2. **Un mot manquant n'est jamais signalé : 0/6**, même quand la transcription le montre clairement. Par exemple, en 67:2 « …والحياة أيكم أحسن… » sans « ليبلوكم ». C'est un choix de la logique (on tolère les mots que la reconnaissance perd). Pour le hifz, c'est **l'oubli le plus fréquent**.
   - Proposition : marquer « à vérifier » un mot manquant **entouré de 2 mots justes de chaque côté dans la même phrase finale**. La reconnaissance perd rarement un mot isolé au milieu d'une phrase qu'elle rend par ailleurs mot pour mot.
3. **Aya sautée : jamais signalée sur texte exact (0/2)**, par choix de conception (v40). À trancher par le chef : pour un hafiz, sauter une aya est une erreur grave. On pourrait la signaler quand l'aya suivante est reconnue entièrement.
4. **« كبير » → « قدير » (67:12) n'est pas détecté, même sur texte exact.** Les deux mots se terminent par « ير » : la tolérance de `wcost` les juge proches, comme c'était le cas pour « البصر/النظر » avant la v42.
5. **Avec le modèle local, 29 fausses alertes**, presque toutes dues à la transcription d'Al-Husary (son tajwid est lent), et non à la logique :
   - le modèle coupe ou invente sur les madd longs : « العزيز العظيم / ميز غفور » pour « العزيز الغفور », ce qui donne la fausse alerte « 67:2 العزيز », 4 fois ;
   - il ajoute des queues : « …من فطور **مرجع البصر** ».
   Le modèle local seul ne peut donc **pas** remplacer Google pour le suivi en direct. En seconde passe, il faut le combiner : ne garder un écart que s'il est confirmé par Google, ou par 2 fenêtres.

## Prototype mesuré : règle « mot manquant » (hors app, `app.js` non modifié)
**Règle** : un mot ni « juste » ni « faux » dans le résultat de `followEval` est signalé s'il remplit deux conditions :
- ses 2 voisins de chaque côté sont « justes » ;
- il n'est pas le premier mot de son aya.

Elle est calculée dans la WebView du téléphone, sur la sortie de la vraie fonction `followEval` en v42. Script : `C:\masari-data\nuit\scripts\proto_manque.py`.

| Entrée | Mots manquants attendus | Détectés | Fausses alertes |
|---|---|---|---|
| Texte idéal (28 cas) | 6 | **6** | **0** |
| Modèle local (28 cas + 2 voix) | 6 | 6 | 6 |
| Vraie transcription Google, séance « والعيش » (14/11) | 0 | – | **0** |
| Vraie transcription Google, séance « النظر » (14/11) | (substitution perdue par Google) | **« 67:3 البصر » signalé** | **0** |

Résultat : la règle rattrape la substitution réelle de Salmane que Google avait fait disparaître. Elle ne donne aucune fausse alerte sur les 2 vraies séances Google, ni sur le texte exact. Sans l'exclusion du premier mot d'aya, il y avait 2 fausses alertes sur Google, sur des mots en début d'aya perdus entre deux phrases.

**C'est la correction la plus rentable trouvée cette nuit.** Elle reste à valider sur plus de séances réelles.

## Pas testé
- La chaîne avec la reconnaissance **Google** sur ces 30 cas : il aurait fallu jouer l'audio au haut-parleur toute la nuit. À faire de jour, ou avec un câble audio.
- D'autres sourates, d'autres voix que Salmane et Al-Husary.

## Fichiers (hors dépôt)
`C:\masari-data\nuit\banc\` (cas audio, `cas.json`, `transcriptions.json`, `ideal.json`), `banc-resultats.json`, `banc-ideal-resultats.json`.
