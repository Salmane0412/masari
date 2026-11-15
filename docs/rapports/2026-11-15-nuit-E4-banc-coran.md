# Nuit — E4. Banc de la logique sur tout le Coran : 18 032 erreurs simulées (15/11/2026, ~02 h 15)

## Méthode (testée réellement, sur le téléphone, v42)
- **Portée** : les **240 unités** (rub') du Coran, avec `expectedOf` et `followEval` de la page en ligne. Une phrase par aya, comme Google.
- **Récitation parfaite** : une fois par unité.
- **Erreurs simulées** : une aya sur 8 environ (au moins 5 mots, ni première ni dernière de l'unité), un mot au milieu, avec 4 types d'erreur :
  - **oubli** du mot ;
  - **substitution lointaine** par un mot du Coran éloigné ;
  - **substitution proche** par un vrai mot que `wcost ≤ 0.4` juge identique, à graphie repliée différente ;
  - **ajout** d'un mot.
- **Notation** : une erreur est détectée si un mot est marqué à ±1 du mot touché. Toute autre marque est une fausse alerte.
- **Variantes** (en mémoire de la page, annulées par rechargement ; `app.js` n'est pas modifié) :
  - v42 actuelle ;
  - + règle « mot manquant » (rapport E) ;
  - + tolérance D (rapport E2) ;
  - les deux réunies.
- **Script** : `C:\masari-data\nuit\scripts\banc_large_coran.py`. **Résultat** : `C:\masari-data\nuit\banc-large-coran.json`. **Durée** : 30 min.

| Variante | Oubli (4 647) | Substitution proche (4 091) | Substitution lointaine (4 647) | Ajout (4 647) | Fausses alertes sur 240 récitations parfaites | Fausses alertes dans les cas d'erreur |
|---|---|---|---|---|---|---|
| **v42 actuelle** | **0 %** | **0 %** | 99,2 % | 97,5 % | 0 | 3 |
| + mot manquant | 83,6 % | 0 % | 99,9 % | 97,6 % | 0 | 3 |
| + tolérance D | 0 % | 90,7 % | 99,9 % | 98,5 % | 0 | 0 |
| **les deux** | **98,6 %** | **91,3 %** | **100 %** | **98,5 %** | **0** | **0** |

Le juz' 29–30 seul (506 cas) donnait les mêmes tendances : v42 0/130 oublis et 0/116 substitutions proches ; les deux règles 127/130 et 112/116.

## Lecture
- **Sur texte exact**, les deux règles ensemble font passer Masari de « ne voit ni les oublis ni les mots proches » à **plus de 91 % de détection sur chaque type d'erreur**, sans aucune fausse alerte sur les 240 récitations parfaites de tout le Coran.
- Ce banc ne contient **pas d'erreurs de reconnaissance**. Sur les 2 vraies séances Google de Salmane :
  - la règle « mot manquant » n'ajoute aucune fausse alerte et rattrape « النظر » ;
  - la tolérance D ajoute 1 à 2 fausses alertes, dues à des graphies uthmani (حيوة) et à des mots déformés par Google.
- **Avant de livrer**, il faut compléter le repli de graphie (rapport E2) puis re-mesurer sur des séances réelles.

## Pas testé
- Les erreurs multiples dans une même aya.
- L'oubli du premier ou du dernier mot d'une aya : la règle ne les vise pas.
- La reconnaissance réelle à cette échelle.
