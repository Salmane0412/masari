# Matin — 5. Silence de 3 s et durée des séances de reconnaissance (15/11/2026, 09 h 13 – 09 h 16)

APK `9bcb729`. `SpeechBridge.kt:69` envoie maintenant `EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 3000` en **Int**. Mesures prises dans le journal Android (`adb logcat`, service de reconnaissance Google) pendant des séances de suivi lancées dans Masari.

| Mesure | Nuit (v42, `3000L`) | Matin (v43, `3000`) |
|---|---|---|
| Avertissement « expected Integer but value was a java.lang.Long » | présent à chaque séance | **absent** |
| Mode du reconnaisseur | `multi = false` | **`multi = true`** (plusieurs énoncés dans la même séance) |
| Durée d'une séance **sans parole** avant `NO_SPEECH_DETECTED` | 5,15 – 5,23 s (6 séances) | **3,0 – 3,2 s** (5 séances : 3,19 / 3,19 / 3,14 / 3,02 / 3,19) |
| Fin de séance **après de la parole** | non mesuré | **3,06 s** et **3,08 s** après `onEndOfSpeech` (2 cas) |
| Une séance qui contient de la parole | – | jusqu'à **16 s** (09:14:29,7 → 09:14:45,7), avec 2 énoncés |
| Délai de redémarrage entre deux séances | environ 20 ms | 12 à 25 ms |

**Conclusion** : le réglage de 3 s est maintenant **pris en compte**. La séance se ferme environ 3,1 s après la fin de la parole, et une même séance peut contenir plusieurs énoncés. Effet secondaire : sans parole, les séances durent 3,1 s au lieu de 5,2 s, ce qui fait **plus de redémarrages au calme** (environ 19 par minute au lieu de 11), sans perte mesurée puisque le redémarrage prend environ 20 ms.

## Limites (testé, mais sans résultat exploitable)
- Al-Husary joué par les haut-parleurs du PC (67:1, puis 5 s de silence, puis 67:2) : Google a détecté de la parole (`onStartOfSpeech` / `onEndOfSpeech`), mais **n'a rendu aucun texte** (`empty final recognition results`). Le son est trop faible à cette distance, comme le 14/11. Je n'ai donc **pas pu vérifier** si une pause de waqf de 2 à 3 s au milieu d'une récitation coupe la phrase.
- Pour le vérifier, il faut ta voix : réciter 67:1 et 67:2 en marquant une pause d'environ 2 s au waqf (voir `BLOQUE.md`).
