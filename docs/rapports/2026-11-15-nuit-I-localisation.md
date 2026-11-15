# Nuit — I. `locate.js` (localisation dans tout le Coran) sur de vraies phrases (15/11/2026, ~02 h 20)

Ce test est hors de la file A–H. Il correspond à la priorité n° 1 de la feuille de route : la localisation libre.

## Méthode (testée réellement, Node 26 sur le PC, `locate.js` de `main` à `a1122ad`)
- **Phrases** : les **vraies phrases finales de Google** issues des 2 séances de Salmane du 14/11 (Al-Mulk, 22 phrases), plus les 5 morceaux du modèle local.
- **Recherche** : chaque phrase est passée **seule**, sans position précédente, à `QLOC.find`.
- **Script** : `C:\masari-data\nuit\scripts\locate_reel.js`. **Résultat** : `C:\masari-data\nuit\locate-reel.json`.
- **Vérité** : on sait que la phrase vient d'Al-Mulk et à quelle aya elle correspond. `find` semble renvoyer l'aya où le lecteur **se trouve après** la phrase. Je compte donc juste toute réponse sur la même aya ou sur la suivante, dans la sourate 67.

| Source | Phrases | Réponse juste (67, à une aya près) | Mauvaise sourate | En attente (moins de 3 mots) |
|---|---|---|---|---|
| Google, séance « والعيش » | 10 | 7 | **2** | 1 |
| Google, séance « النظر » | 13 | 10 | 0 | 3 |
| Modèle local (morceaux de 30 s) | 5 | 4 | 0 | 1 |

**Les 2 erreurs, instructives :**
- « نيه بلوكم ايكم احسن عملا وهو العزيز الغفور » → **16:92**. Le début a été déformé par Google, et la fin est une formule fréquente.
- « الذي خلق سبع سماوات فترى » → **65:12**, où l'on lit aussi « …الذي خلق سبع سماوات… ». C'est une vraie ambiguïté du texte.

## Conclusion
- Sur de vraies phrases bruitées, `locate.js` retrouve le bon endroit **dans 21 cas sur 24 où il répond (88 %)**. Ses erreurs viennent des formules partagées entre sourates.
- Il faut donc l'utiliser comme le prévoit le plan de CLAUDE.md : **d'abord près de la dernière position**, et la recherche large seulement si plusieurs phrases de suite ne collent plus.
- Il faut aussi **attendre 2 phrases concordantes** avant de sauter vers une autre sourate. Avec cette règle, les 2 erreurs ci-dessus n'auraient pas fait sauter le suivi : elles se suivent, mais pointent vers 2 endroits différents (16:92 puis 65:12), et les phrases suivantes reviennent en 67.

## Pas testé
- L'intégration dans l'interface (`locate.js` n'est pas branché).
- D'autres sourates que la 67 en réel.
