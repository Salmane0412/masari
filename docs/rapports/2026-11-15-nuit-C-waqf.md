# Nuit — C. Marques de pause (waqf) alignées sur `data.js` (15/11/2026, ~00 h 50)

## Testé réellement
- **Source** : Tanzil Uthmani 1.1, téléchargé avec les marques de pause, la sajda et le rub' (`tanzil.net/pub/download`, `quranType=uthmani`, `marks=true`). Il est rangé dans `C:\masari-data\qul\tanzil\`, hors dépôt.
- **Licence** : la licence CC BY 3.0 est lue dans l'en-tête du fichier, avec cette clause : « copier et distribuer des copies *verbatim*, CHANGER LE TEXTE N'EST PAS PERMIS ». La source doit être citée, avec un lien vers tanzil.net. Extraire les marques pour les poser sur le même texte est compatible : le texte n'est pas modifié. Embarquer le fichier dans l'app suppose de citer Tanzil et de faire le lien.
- **Script** : `C:\masari-data\nuit\scripts\waqf.py`. Il découpe chaque aya en mots et rattache chaque marque au mot qui la précède.
- **Résultat** : `C:\masari-data\qul\waqf.json`, au format `[sourate, aya, index du mot dans data.js, signe]`, soit **4 364 marques**.
- **Écarts avec `data.js`** : **0** sur 6 236 ayas. Même nombre de mots et même graphie partout, une fois retiré le tatwil (`ـ`) que Tanzil ajoute devant l'alif suscrit. `data.js` est donc le texte Tanzil Uthmani sans les marques ; les index de mots peuvent être utilisés tels quels.
- **Vérifications ponctuelles** :
  - 2:2 « رَيْبَ ۛ … فِيهِ ۛ » : la mu'ânaqa est correcte ;
  - 67:2 « عَمَلًا ۚ » ;
  - 67:3 « طِبَاقًا ۖ », « تَفَٰوُتٍ ۖ » ;
  - les 5 sakta (ۜ) tombent en 18:1, 36:52, 69:28, 75:27 et 83:14, ce qui est conforme à Hafs.

| Signe Unicode | Dar al-Ma'rifa | Nombre |
|---|---|---|
| ۘ U+06D8 | م (lâzim) | 22 |
| ۖ U+06D6 | صلى (wasl awlâ) | 1 682 |
| ۗ U+06D7 | قلى (waqf awlâ) | 603 |
| ۚ U+06DA | ج (jâ'iz) | 1 972 |
| ۛ U+06DB | ∴ (mu'ânaqa, par paires) | 12 (6 paires) |
| ۙ U+06D9 | لا (ne pas s'arrêter) | 68 |
| ۜ U+06DC | س (sakta) | 5 hors mots (2 autres ۜ sont le petit sîn de « يبصط/بصطة », pas des pauses) |
| ۞ / ۩ | début de hizb / sajda | 199 / 15 (pas des waqf) |

Les 5 signes de la Dar al-Ma'rifa (م، صلى، قلى، ج، ∴) ont donc chacun un équivalent Unicode direct. Le « لا » existe aussi dans Tanzil, alors qu'il n'est pas dans la légende relevée par l'utilisateur. Il reste à vérifier si son mushaf l'imprime.

## Rendu sur le téléphone (testé à 01 h 41)
Une ligne de test a été insérée temporairement dans la page de la séance 224, avec la classe `.w` du mushaf (police déclarée : « Amiri Quran », puis « Noto Naskh Arabic »…). **Les 7 signes s'affichent comme de vrais glyphes**, au-dessus du mot qui précède : ج، صلى، قلى، م، ∴ (trois points)، س، لا. Aucun carré ni caractère manquant. Capture : `C:\masari-data\nuit\captures\waqf-zoom.png`.

Ils sont petits à la taille actuelle du texte. Un léger agrandissement ou une couleur distincte les rendrait plus lisibles.

## Pas testé
- La concordance exacte avec la mise en page du Mushaf de Médine. Tanzil suit l'édition de Médine, mais rien n'a été comparé page par page.

## Proposition au chef
Charger `waqf.json` (environ 60 Ko) à côté de `data.js` et afficher le signe en exposant après le mot. On peut aussi insérer les signes dans `data.js` au même index : ce serait alors le texte Tanzil complet, toujours non modifié. Dans les deux cas, ajouter la mention « Texte : Tanzil Project, tanzil.net (CC BY 3.0) ».
