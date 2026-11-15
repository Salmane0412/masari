# Matin — 4. Panneau d'erreurs sur le téléphone, v43 (15/11/2026, 09 h 11)

Arrêt « قف » provoqué par la phrase injectée « فارجع النظر هل ترى… » dans l'unité 224, en 4 configurations. La rotation a été forcée, puis remise en automatique. Le mode clair ou sombre est émulé dans la page. Les compteurs `errors` ont été restaurés après le test. Captures : `C:\masari-data\matin\panneau-v43-*.png`.

| Configuration | Panneau `#rec-out` | Au-dessus des barres ? | Texte et boutons lisibles | Mot fautif « البصر » visible |
|---|---|---|---|---|
| Portrait sombre | 588–714 px, z 45 | **oui** | **oui** : message entier, « أعد من الآية » et « تجاوز الكلمة وتابع » | **non** (693–766 px, sous le panneau et la barre) |
| Portrait clair | 588–714 px, z 45 | **oui** | **oui** | **non** : le surlignage rouge dépasse sous le bouton « إنهاء وتقييم » |
| Paysage sombre | 83–198 px, z 45 | **oui** | **oui** | **non** : seules 2 lignes de texte restent visibles, et ce ne sont pas celles du mot fautif |
| Paysage clair | 83–198 px, z 45 | **oui** | **oui** | **non** |

**Avant / après** :
- **v42 (nuit)** : le message était caché sous la barre « متوقف عند خطأ » dans les 4 configurations.
- **v43** : le **panneau est entièrement visible au-dessus des barres**, partout. Point **OK**.

**Reste à faire** : le page ne fait pas défiler jusqu'au mot fautif, qui reste caché sous les barres ou hors de l'écran dans les 4 cas.
- En **portrait**, un défilement suffirait (le prototype de la nuit le faisait).
- En **paysage**, il ne reste qu'environ 2 lignes de texte entre le panneau et les barres : une disposition compacte reste nécessaire.
