# Matin — 7. Cas de test supplémentaires pour le suivi de récitation (15/11/2026, ~09 h 25)

Sources lues le 15/11. Les descriptions de Tarteel viennent de ses propres pages ; les autres sont des travaux de recherche. Aucun contenu n'a été copié : seules les catégories ont été reprises et adaptées.

## Ce que disent les sources
- **Taxonomie des événements de récitation** ([arXiv 2609.12085](https://arxiv.org/pdf/2609.12085)), étiquetés un par un :
  - erreurs : **substitution, omission, ajout** ;
  - erreurs **corrigées par le récitant** : substitution corrigée, omission corrigée ;
  - événements **bénins** : répétition, lettre, graphie, basmala, isti'adha.

  Deux règles utiles : une omission **en fin d'enregistrement** compte comme une vraie omission, et une différence de graphie effacée par la normalisation ne compte pas comme un événement.
- **Jeu de données Al-Ikhlas, Umm al-Qura** ([Mendeley](https://data.mendeley.com/datasets/sxtmmr6mvk)) : les erreurs de hifz les plus courantes, c'est-à-dire manque, remplacement, ajout et répétition, en 1 506 enregistrements. Licence à vérifier avant usage.
- **Tarteel** ([page d'aide](https://support.tarteel.ai/en/articles/16559266-a-mistake-was-flagged-that-i-didn-t-make), [annonce de la détection d'erreurs](https://tarteel.ai/blog/introducing-mistake-detection/), [demande des utilisateurs](https://feedback.tarteel.ai/feature-requests/p/ability-to-report-remove-false-positive-errors)) :
  - selon l'éditeur, les fausses erreurs viennent de l'audio brouillé, des madd et du tashkil ;
  - côté utilisateurs, les **fausses alertes sont la première plainte**, et ils demandent un bouton « ce n'est pas une erreur ».
- **Évaluation indépendante** ([arXiv 2510.12858](https://arxiv.org/pdf/2510.12858)) : elle juge élevées les fausses alertes de Tarteel sur des récitations correctes, et regrette l'absence de bancs comparés à des experts humains.
- **Mutashabihat** : plus de 1 200 ayas concernées selon des études malaisiennes ([hrmars](https://hrmars.com/papers_submitted/10821/tahfiz-education-in-malaysia-issues-and-problems-in-memorising-quranic-mutashabihat-verses-and-its-solution.pdf)), avec Al-Waqi'a et Ya-Sin parmi les plus difficiles. QUL fournit un outil pour les trouver ([tutoriel](https://qul.tarteel.ai/docs/tutorial-mutashabihat-end-to-end)).

## Cas proposés (à ajouter à `follow-replay.pw.js` ou à mon banc)
| # | Cas | Exemple (sourate 67 sauf mention) | Attendu |
|---|---|---|---|
| 1 | **Substitution corrigée** par le récitant | « …أيكم أكثر… أحسن عملا… » | « corrigé » (ou rien), pas une faute pleine |
| 2 | **Omission corrigée** | « …ليبلوكم عملا… أيكم أحسن عملا » | rien |
| 3 | **Omission du dernier mot** avant l'arrêt | 67:1 sans « قدير », puis fin de séance | faute signalée |
| 4 | **Passage vers une aya semblable d'une autre sourate** (انتقال) | « الذي خلق سبع سماوات طباقا » puis la suite de 71:15 | faute dès le premier mot qui diverge, **pas de saut** vers 71 |
| 5 | **Waqf puis ibtida en reprenant 2 ou 3 mots** | « …ليبلوكم أيكم أحسن عملا ۚ أحسن عملا وهو العزيز… » | rien (reprise légitime) |
| 6 | **Pause de 2 à 3 s au waqf** au milieu d'une aya | ta voix (voir `BLOQUE.md`) | phrase non coupée, aucun mot perdu |
| 7 | **Inversion de deux ayas** | 67:4 récitée avant 67:3 | faute (ordre) |
| 8 | **Saut de 2 ayas puis retour** | 67:1, 67:4, puis 67:2 | ayas sautées signalées, sans blocage |
| 9 | **Bégaiement d'un mot** | « الحمـ الحمد » ; « الذي الذي خلق » | rien |
| 10 | **Graphie courante contre graphie uthmani** (régression de v43) | ذلك, هذا, هذه, لكن, إله, الصلاة, الزكاة, إبراهيم, السماوات | rien |
| 11 | **Mot coupé en deux par Google** | « نيه بلوكم » pour « ليبلوكم » ; « لا » pour « لها » | rien |
| 12 | **و initial ajouté ou retiré par Google** | « وهل » / « هل » ; « والعزيز » / « وهو العزيز » | rien |
| 13 | **Mutashabihat en Ya-Sin et Al-Waqi'a** | début identique, fin différente | faute au premier mot qui diverge |
| 14 | **Hadr (rapide) contre tahqiq (lent)** | même passage à 2 vitesses (audio) | même résultat |
| 15 | **Erreur de tashkil seul** | « عملٌ » pour « عملاً » | non visé (le suivi travaille au niveau du mot) : à indiquer clairement à l'utilisateur |

## Comment les produire
- **Cas 1 à 5 et 7 à 13** : en texte, avec mon injecteur (`C:\masari-data\nuit\inject.py`) ou `follow-replay.pw.js`.
- **Cas 10** : à mesurer sur tout le Coran avec `parfait_local.py`.
- **Cas 6 et 14** : il faut de l'audio réel, c'est-à-dire ta voix, ou Al-Husary « Muallim », plus lent, contre Al-Afasy, plus rapide.
