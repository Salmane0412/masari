# Nuit — F. Modèle Coran local en flux simulé, fenêtre glissante de 8 s (15/11/2026, ~01 h 45)

## Testé réellement (sur le PC : i5-7200U, 2 cœurs / 4 fils, int8, 4 fils)
- **Audio** : la récitation de Salmane du 14/11 (`recitation.wav`, 122 s), lue comme un flux.
- **Fenêtre et pas** : 8 s, avancée de **2 s**.
- **Validation d'un mot** : un mot est validé quand il **commence plus de 1 s avant la fin de la fenêtre** et finit après le dernier mot validé.
- **Script** : `C:\masari-data\nuit\scripts\fenetre.py` (modèle `tarteel-ai/whisper-base-ar-quran`, `word_timestamps=True`).
- **Notation** : la même que dans le rapport voix, sur la portée commune 67:1 → 67:8 (79 mots).

| Mesure | Fenêtre 8 s / pas 2 s | Rappel : fichier entier (rapport voix) | Rappel : Google sur le téléphone |
|---|---|---|---|
| Mots justes | **73 / 79 (92,4 %)** | 72 / 79 (91,1 %) | 75 / 79 (94,9 %) |
| Mots ajoutés par erreur | **nombreux** : doublons aux jonctions des fenêtres (« سموات سموات », « ما ما ») et débris (« والمومنين », « قدير ») | 0 répétition inventée | 0 |
| Calcul par fenêtre | médiane **6,4 s**, max 18,1 s | – | – |
| Tenue du temps réel | **NON** : 6,4 s de calcul pour un pas de 2 s | – | oui |
| Latence d'un mot (de sa fin dans l'audio à sa validation) | médiane **7,6 s**, p90 11,7 s | – | 0 à 3 s après la fin de la phrase |

## Où va le temps (une fenêtre de 8 s, 4 essais)
| Réglage | Secondes par fenêtre |
|---|---|
| avec horodatage des mots | **5,0 – 5,3** |
| sans horodatage des mots | **2,3 – 2,4** |
| sans horodatage ni marques de temps | 2,3 – 3,9 |

Whisper complète toujours l'entrée jusqu'à 30 s : une fenêtre de 8 s coûte donc presque autant qu'un morceau de 30 s. L'horodatage mot à mot double ce coût.

## Conclusions
1. **Sur ce PC, en flux, le modèle local n'est pas assez rapide pour un suivi en direct** tel que le demande la feuille de route (fenêtre de ~8 s), puisqu'il faut l'horodatage des mots. Sans horodatage, on tiendrait le temps réel avec un pas de 3 s, pour une latence d'environ 5 à 6 s. C'est trop lent pour un suivi mot à mot ; c'est acceptable pour une **vérification par phrase**.
2. Sur le téléphone (transformers.js ou ONNX, sans GPU), le coût sera probablement plus élevé encore. Ce n'est **pas mesuré**.
3. **Recommandation** :
   - garder Google pour le direct ;
   - utiliser le modèle local en **seconde passe sur des morceaux d'environ 30 s**, ce qui est sa taille native (0,12 × le temps réel, mesuré le 14/11), ou à la fin de la séance ;
   - croiser les deux avec la règle « mot manquant » du rapport E, qui rattrape déjà le cas « النظر » sur la sortie Google.
4. Les doublons aux jonctions des fenêtres obligeraient de toute façon à un filtrage, sinon la règle d'ajout de Masari produirait des fausses alertes.

## Pas testé
- Les pas de 1 s et la marge de 2 s : les essais ont été arrêtés, le premier suffisait à conclure. Un pas plus court augmente le coût.
- Le modèle exécuté sur le téléphone.
