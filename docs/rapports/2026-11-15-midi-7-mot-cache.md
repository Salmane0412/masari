# Midi — 7. Mot fautif caché sous le panneau d'erreurs (15/11/2026, 11 h 26), v46

## Mesure (téléphone, portrait, arrêt « قف » sur « فارجع النظر »)
| Élément | Position (px, écran de 900 px de haut) |
|---|---|
| En-tête collant `#top` | 0 – 61 |
| **Zone de texte libre** | **61 – 588** (527 px) |
| Panneau `#rec-out` | 588 – 714 |
| Barre « متوقف عند خطأ » `#fol-status` | 730 – 762 |
| Bouton « إنهاء وتقييم » `#fol-ctl` | 758 – 828 |
| Onglets `#tabs` | 836 – 900 |
| **Mot fautif « البصر »** | **693 – 766** : sous le panneau et la barre, donc **invisible** |

Cause : à l'arrêt, la page ne défile pas. Le mot reste où la lecture l'avait laissé, c'est-à-dire en bas de l'écran, sous les couches fixes.

## Essai (en mémoire de la page, annulé ensuite)
Défilement `scrollBy` pour centrer le mot dans la zone libre, entre le bas de l'en-tête et le haut du panneau. Le mot passe à **288 – 361 px** : **entièrement visible**, au-dessus du panneau (`scrollY` = 405, la page peut défiler jusqu'à 3 539). Testé 2 fois, résultat identique.

**Code proposé au chef** (non appliqué), à appeler juste après l'affichage du panneau dans `followHalt` :
```js
function showBadWord(k) {
  const w = document.querySelector(`#view .w[data-k="${k}"]`) || [...document.querySelectorAll('#view .w')].find(e => /bad/.test(e.className));
  const top = $('#top').getBoundingClientRect().bottom, bottom = $('#rec-out').getBoundingClientRect().top;
  if (!w || bottom - top < w.offsetHeight + 16) return false;          // pas la place (paysage) : voir ci-dessous
  const b = w.getBoundingClientRect(); window.scrollBy({ top: (b.top + b.bottom) / 2 - (top + bottom) / 2, behavior: 'smooth' }); return true;
}
```
(Le sélecteur exact du mot est à adapter : je n'ai pas vérifié l'attribut que pose `followHalt` sur le mot fautif.)

## Paysage
- Mesure de la nuit (v43, même mise en page qu'aujourd'hui pour le panneau) : écran de **384 px** de haut, panneau de 83 à 198 px, barres en bas. Il ne reste qu'**environ 20 px** entre l'en-tête et le panneau : aucun défilement ne peut y faire tenir un mot de 73 px.
- La rotation forcée de ce matin n'a pas pris (hauteur toujours 900 px pendant l'essai) : le paysage n'a donc pas été re-mesuré en v46.
- **Proposition** : en paysage (`@media (orientation: landscape) and (max-height: 500px)`) :
  - placer le panneau **sur le côté** (par exemple 40 % de la largeur, ancré à gauche, toute la hauteur) ;
  - **ou** le réduire à une ligne, avec ses boutons en ligne, et cacher `#fol-status` pendant l'arrêt, puisque le panneau dit déjà « توقّف » ;
  - puis appeler la même fonction de centrage.
