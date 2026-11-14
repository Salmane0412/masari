# Rapport du testeur — reconnaissance sur la voix de l'utilisateur (14/11/2026)

## Protocole (testé réellement)
- L'utilisateur récite Al-Mulk depuis 67:1, sans basmala, pendant 2 min, entre le PC et le téléphone (~50 cm de chacun).
- **Une seule récitation, captée en même temps** par :
  - le micro intégré du PC, enregistré en WAV 16 kHz (122 s) ;
  - Masari sur le téléphone (Android 13, reconnaissance Google via `SpeechBridge`), unité 224, arrêt « قف » désactivé pour mesurer tout le passage.
- L'enregistrement reste en local, hors dépôt.
- Écarts réellement prononcés (entendus par les 4 moteurs, et confirmés par l'utilisateur pour le premier) :
  1. **erreur volontaire en 67:2** : mot ajouté après « والحياة » (« والعيش ») ;
  2. reprise en 67:3 : « سبع سماوات فترى ما ترى سماوات طباقا » ;
  3. « وللذين كفروا بربهم » dit deux fois en 67:6.
- L'utilisateur pense avoir fait 2 erreurs volontaires (peut-être 3) ; la 2e est probablement la reprise de 67:3.
- Portée commune notée : 67:1 → 67:8 « من الغيظ » (fin de l'enregistrement du PC), soit **79 mots**.
- Score : alignement mot à mot tolérant à la graphie (uthmani du texte Tanzil contre imla'i des moteurs : « سموت » = « سماوات ») ; les mots en trop prononcés par l'utilisateur ne comptent pas comme fautes du moteur.
- Moteurs locaux : faster-whisper 1.2.1, CPU int8, 4 fils, beam 1, sur le PC (i5-7200U, 2 cœurs, sans GPU).

## Résultats

| Moteur | Mots justes / 79 | Remplacés | Manquants | Vitesse (calcul / audio) | Répétitions inventées |
|---|---|---|---|---|---|
| **Téléphone : Google (Masari)** | **75 (94,9 %)** | 2 | 2 | temps réel ; résultats par phrase, 0 à 3 s après la fin de la phrase | 0 |
| **Coran local, VAD, sans contexte** (`tarteel-ai/whisper-base-ar-quran`, `vad_filter=True`, `condition_on_previous_text=False`) | **72 (91,1 %)** | 5 | 2 | **0,12** (15 s pour 122 s) | 0 |
| Coran local, VAD, avec contexte (réglage par défaut) | 66 (83,5 %) | 10 | 3 | 0,15 | 1 (« سبع سبع ») ; et un passage sauté en 67:5 |
| Coran local, sans VAD, sans contexte | 64 (81,0 %) | 11 | 4 | 0,13 | 0 ; mais des mots coupés aux limites fixes de 30 s (60 s : « تفاوت » coupé, fin de 67:3 perdue) |
| Coran local, sans VAD, avec contexte | 60 (75,9 %) | 5 | 14 | 0,14 | 2 (« برب ربهم », deux fois) ; fin de 67:3 entièrement perdue |
| Whisper base générique | 56 (70,9 %) | 20 | 3 | 0,15 | 0 ; numéros parasites (« 17. ») |

Rappel du test précédent (audio de studio Al-Husary, 67:1–5) : le modèle Coran (réglage par défaut, une aya par fichier) trouvait 100 % des mots, avec des queues inventées sur 2 ayas sur 5.

### Les écarts prononcés sont-ils visibles dans la transcription ?
| Écart | Google (téléphone) | Coran local VAD sans contexte | Générique |
|---|---|---|---|
| 67:2, mot ajouté (erreur volontaire) | oui, « والعيش » | oui, « العشر » | oui, « والعيشه » |
| 67:3, reprise | oui, « فترى ما ترى سماوات » | oui, déformée (« فانترى ما تأمترى سموات ») | partiellement |
| 67:6, répétition | oui | oui | oui |

### Et le suivi de Masari sur le téléphone (logique actuelle de `main`) ?
- Position finale : 67:9 (l'utilisateur a continué un peu après le bip) ; 84 mots justes.
- **Erreur volontaire de 67:2 non signalée** : un mot ajouté est toléré par conception (la reconnaissance en ajoute souvent).
- **2 fausses erreurs** signalées en 67:3 (« طباقا », « في »), dans la zone de reprise. L'utilisateur confirme que « في » n'est pas une erreur de sa part.

## Conclusions
1. Sur une voix d'homme non professionnelle, au micro intégré, la reconnaissance Google du téléphone est la plus juste (95 %). Le modèle Coran local la suit de près (91 %), à condition de **régler VAD activé et `condition_on_previous_text=False`**. Les réglages par défaut perdent 7 à 15 points, inventent des répétitions et sautent des passages.
2. Les répétitions inventées viennent du conditionnement sur le texte précédent : 0 sans contexte, 1 à 2 avec. Les doublons de 67:6 sont réels (entendus par les 4 moteurs).
3. Vitesse : le modèle local tourne 7 à 8 fois plus vite que le temps réel sur ce PC faible. Une fenêtre glissante de ~8 s coûterait ~1 s de calcul, ce qui laisse de la marge pour le suivi en direct.
4. Écarts avec le test au haut-parleur : Google ne rendait que ~25 % des mots d'Al-Husary joué par le haut-parleur du PC, contre 95 % sur une voix réelle à 50 cm. Le mauvais score précédent tenait donc surtout au montage (haut-parleur faible, tajwid lent avec longs silences), pas à Google seul.
5. Pour Masari, le défaut principal est la **logique** : une insertion volontaire n'est pas signalée, et une reprise produit de fausses erreurs. Les transcriptions contiennent l'information : la logique devrait signaler un mot ajouté s'il se retrouve dans les transcriptions de plusieurs moteurs (ou plusieurs passes), et traiter « reprise » à part.

## Pas testé
- Le modèle local **sur le téléphone** (ONNX / transformers.js) et en flux continu (fenêtre glissante) : non fait, seulement des fichiers entiers sur le PC.
- Une erreur de remplacement (mot changé) : l'utilisateur a fait des ajouts et une reprise, pas de substitution claire.
- D'autres voix, d'autres sourates, du bruit de fond.
- L'examen 🎓 sur la voix de l'utilisateur.

## Ce qui demande une action de l'utilisateur
- Pour tester une substitution : réciter à nouveau en remplaçant un mot (ex. « أحسن عملا » → « أكثر عملا ») et dire lequel.
