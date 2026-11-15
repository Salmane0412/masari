# Idées pour Masari — nuit du 15/11/2026

Ces idées sont classées par **valeur pour le hifz** (V, de 1 à 5) puis par **coût** (C, de 1 à 5, 1 = faible).
- Les sources externes ont été lues le 15/11. Leurs fonctions sont décrites d'après les pages des éditeurs : ce sont des promesses commerciales, pas des tests indépendants.
- Les « observé » renvoient aux mesures réelles des rapports du testeur.
- Aucun code tiers n'a été copié. Les projets cités sont des pistes, et leur licence doit être vérifiée avant tout emprunt.

| # | Idée | V | C | Pourquoi (observé / source) |
|---|---|---|---|---|
| 1 | **Seconde passe avec le modèle Coran local** après chaque séance : retranscrire l'audio enregistré et revérifier les mots que Google a laissés tomber | 5 | 3 | Observé : Google a supprimé le mot changé « النظر » ; le modèle local l'a entendu (« المظر »). Le modèle tourne à 0,12 × le temps réel sur le PC. Masari ne peut pas signaler un mot que la reconnaissance a perdu. |
| 2 | **Signes de waqf dans le mushaf** depuis `waqf.json` (4 364 marques, 0 écart avec `data.js`) | 4 | 1 | Rapport C de cette nuit. Il suffit d'afficher les marques, puis de faire « relire jusqu'au prochain waqf » lors d'une erreur. |
| 3 | **Surligner le mot pendant l'écoute d'Al-Husary**, grâce aux horodatages mot à mot | 4 | 2 | Les segments existent (API publique Quran.com, rapport D). C'est le standard de Quran.com et de Tarteel. Utile pour apprendre en écoutant. |
| 4 | **Faire défiler jusqu'au mot fautif** et ne jamais cacher le message d'erreur | 4 | 1 | Observé cette nuit : le message « توقّف. أخطأتَ عند… » (`#rec-out`) est caché derrière la barre « متوقف عند خطأ » et le bouton, et l'aya fautive reste hors de l'écran. |
| 5 | **« Rien entendu » ≠ « faux »** partout : examen, suivi, statistiques | 4 | 1 | Observé le 14/11 (examen 0/3 sans aucun son). Le correctif de l'examen est fait. À vérifier dans les statistiques de mots faibles. |
| 6 | **Journal des erreurs par mot, avec révision ciblée** (les mots où l'on bute le plus, en premier) | 4 | 2 | Tarteel met en avant un « historique des erreurs ». Masari a déjà les « مواضع التثبيت » : il faudrait une liste triée et un exercice dédié. |
| 7 | **« Ne pas avancer tant que l'erreur n'est pas corrigée »**, en option (c'est l'arrêt « قف » actuel, mais plus fiable) | 3 | 2 | Tarteel propose ce réglage. Chez Masari, l'arrêt « قف » coupe encore une récitation juste (« رضيع » pour « فارجع ») : ne s'arrêter que si 2 passes ou 2 mots consécutifs sont faux. |
| 8 | **Tolérance par la racine** : comparer les mots sans l'article, avec des poids différents pour les lettres de la racine et les affixes | 3 | 2 | « البصر »/« النظر » est maintenant distingué (v42). Le banc E de cette nuit mesure les autres paires. |
| 9 | **Intervalles de révision visibles** (1, 3, 7, 14, 30 jours) avec un indicateur de rétention par rub' | 3 | 2 | C'est le cœur d'HifzPath, de Retain Quran et d'Al Mueen. Masari a un plan, mais pas de courbe d'oubli affichée. |
| 10 | **Mode « mutashâbihât »** : liste des ayas qui commencent pareil (ex. « الذي خلق » en 67:2 et 67:3), avec un exercice pour les distinguer | 4 | 3 | Observé : les vraies confusions du suivi viennent de débuts identiques. Ce sont aussi les pièges classiques du hifz. |
| 11 | **Écoute en boucle d'une aya ou d'une plage**, avec un nombre de répétitions et une pause pour répéter | 3 | 1 | C'est le cycle « écouter, répéter, réciter » de Quoranize et d'Itqan. Les fichiers par aya d'everyayah existent déjà. |
| 12 | **Reprise par recherche large** quand plusieurs mots ne collent plus (`locate.js`) | 3 | 3 | Le test du 14/11 a montré un suivi bloqué après une aya sautée. `locate.js` est prêt, mais il n'est pas branché à l'interface. |
| 13 | **Indicateur de qualité de la reconnaissance** pendant la séance (mots reçus par minute), avec « parle plus près » s'il est trop bas | 2 | 1 | Le 14/11, au haut-parleur, 25 % des mots seulement ont été reçus. L'utilisateur ne le voyait pas. |
| 14 | **Exporter la séance** (audio + transcription) pour la montrer à un enseignant | 2 | 2 | Utile pour la relation enseignant-élève. L'audio doit rester local et n'être partagé que sur choix explicite. |
| 15 | **Tajwid du mot cliqué** (règle et couleur expliquées), à partir du mini-livre des makhârij | 2 | 4 | C'est déjà prévu dans la feuille de route. QUL fournit la morphologie (avec un compte). |

### Ajouts de fin de nuit (tirés des mesures des rapports B, J et E4)
| # | Idée | V | C | Pourquoi (observé) |
|---|---|---|---|---|
| 16 | **Mode hors ligne honnête** : détecter l'absence de réseau et dire « suivi vocal, écoute et examen indisponibles hors ligne » ; mettre en cache les fichiers audio de l'unité du jour | 4 | 1 | Hors ligne, l'examen continue sans le son du récitateur, l'écoute affiche un message trompeur, et Google n'a pas de pack arabe hors ligne sur ce téléphone (`error 12`). |
| 17 | **Synthèse vocale native** (TextToSpeech d'Android via `MasariNative`) pour toutes les consignes parlées | 3 | 2 | `speechSynthesis` est absent de la WebView : le test vocal est muet dans l'app. |
| 18 | **Choix du récitateur** pour l'écoute et l'examen (Al-Husary pour apprendre, Al-Afasy…) | 2 | 1 | L'écoute et l'examen jouent Al-Afasy, alors que le plan d'horodatage vise Al-Husary. Vérifié à 02 h 35 : l'API publique de Quran.com donne des segments mot à mot pour Al-Afasy (id 7 ; fichier `Alafasy/mp3/…` de Quran.com, à comparer avec l'everyayah 128 kbps que joue Masari) et pour **Al-Husary « Muallim »** (id 12), la récitation d'enseignement, faite pour répéter après le récitateur. |

## Projets ouverts à étudier, sans copier de code avant vérification de la licence
- [Real-Time Quran recitation tracker](https://github.com/yayaiu6/Real-Time-Quran-recitation-tracker-System) : suivi dans une fenêtre locale et appariement par distance de Levenshtein. Il mentionne un modèle Conformer-CTC sous licence MIT. Sa précision de plus de 98 % est annoncée par l'auteur, pas mesurée par moi.
- [quran-align](https://github.com/cpfair/quran-align) : horodatage mot à mot de l'audio de type everyayah.
- [Quran Timing Helper](https://gitea.com/quraniio/quran-timing-helper) : Whisper suivi d'un alignement forcé wav2vec2-CTC.
- [Tadabur](https://fherran.github.io/tadabur) : jeu de données d'environ 1 400 h avec horodatages, et modèles Whisper affinés (Small).
- [recite_quran](https://pub.dev/packages/recite_quran) : moteur sur l'appareil (Zipformer-CTC + DTW), intéressant pour le hors-ligne mobile.

Sources des fonctions d'applications : [Tarteel (App Store)](https://apps.apple.com/us/app/-/id1391009396), [blog Tarteel sur la répétition espacée](https://tarteel.ai/blog/spaced-repetition-and-quran-memorization-how-to-make-your-hifz-stick-for-life/), [HifzPath](https://mwm.ai/apps/hifzpath-quran-memorization/6761689759), [Retain Quran](https://apps.apple.com/us/app/-/id1624792039), [Quoranize](https://apps.apple.com/us/app/id6756642617), [Al Mueen Ala Al Hifz](https://apps.apple.com/app/id6758395448), [Itqan Ayah](https://apps.apple.com/app/id6468956692).
