# Nuit — D. Horodatage mot par mot d'Al-Husary, sourate 67 (15/11/2026, ~01 h 05)

## Testé réellement
- **Audio** : les 30 fichiers par aya d'Al-Husary sur everyayah (`Husary_64kbps`, 660 s au total), rangés dans `C:\masari-data\audio-husary-67\`.
- **Référence (sans compte)** : les segments mot à mot publiés par l'API publique de Quran.com (`/api/v4/recitations/6/by_ayah/67:N?fields=segments`), au format `[mot, début_ms, fin_ms]`, **pour exactement ces fichiers** (64 kbps). Les segments de QUL demandent un compte : voir `BLOQUE.md`. La licence de ces segments n'est pas indiquée, ils restent donc en local.
- **Méthode** : le modèle Coran local (`tarteel-ai/whisper-base-ar-quran`, faster-whisper, `word_timestamps=True`) transcrit chaque aya. Ses mots sont ensuite alignés sur ceux de `data.js` (programmation dynamique tolérante à la graphie). Ce n'est **pas** un vrai alignement forcé : on garde les temps des mots que le modèle a entendus.
- **Script** : `C:\masari-data\nuit\scripts\segments.py`. **Sortie** : `C:\masari-data\segments-67.json`, au format `[index_mot, début_modèle, fin_modèle, début_réf, fin_réf]` par aya.

## Résultats (ayas 67:2 à 67:30 : 324 mots)
| Mesure | Valeur |
|---|---|
| Mots horodatés | **324 / 324** (100 %) |
| Erreur sur le début du mot | médiane **80 ms**, moyenne 219 ms, p90 650 ms, p95 910 ms |
| Erreur sur la fin du mot | médiane **70 ms**, moyenne 152 ms, p90 400 ms |
| Débuts à ≤ 100 / 250 / 500 ms | **61 % / 79 % / 85 %** |
| Temps de calcul | 311 s pour 660 s d'audio (0,47 × le temps réel avec `word_timestamps`, sur l'i5-7200U, CPU partagé avec un autre calcul) |

**67:1 exclue** : le modèle **invente la basmala** en tête de 67:1, alors qu'elle n'est pas dans le fichier audio. Tous les mots de l'aya sont alors décalés d'environ +5 s : médiane 5 060 ms d'erreur, 2 mots non horodatés.

Les grosses erreurs (> 1 s, 13 mots) touchent surtout un mot après une longue pause ou un madd. Le début du mot est souvent pris trop tôt, dans le silence qui le précède.

## Conclusion
- Pour **surligner le mot pendant l'écoute**, les segments de Quran.com sont exacts par construction et gratuits : il vaut mieux les utiliser directement. Ce sont les fichiers mêmes que Masari joue (everyayah), il faut seulement en vérifier les conditions d'utilisation.
- L'horodatage du modèle local (61 % des débuts à 100 ms près) suffit pour **situer la voix de l'utilisateur** dans le texte : seconde passe, suivi.
- Il ne suffit pas pour un surlignage au mot près sur 1 mot sur 5.
- Il ne faut **jamais** lui faire confiance sur l'aya 1 d'une sourate, à cause de la basmala inventée. Dans le suivi en direct, ce même défaut pourrait faire croire à une basmala récitée.

## Pas testé
- Un vrai alignement forcé (CTC ou wav2vec2) : il n'a pas été installé cette nuit (2,6 Go libres sur C:).
- D'autres récitateurs que Al-Husary, et la voix de l'utilisateur, faute de référence mot à mot.
