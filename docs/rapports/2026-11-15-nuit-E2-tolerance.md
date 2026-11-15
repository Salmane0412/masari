# Nuit — E2. Tolérance de `wcost` : des mots différents comptés justes (15/11/2026, ~02 h)

## Constat (testé réellement sur le téléphone, v42)
Le suivi accepte un mot entendu si `wcost(attendu, entendu) <= 0.4`. Pour les sourates 67 à 114, j'ai calculé ce seuil sur toutes les paires de formes de 3 lettres ou plus : **2 349 formes donnent 8 986 paires jugées « identiques »**. Parmi elles :
- الرحيم / الجحيم ;
- وهو / وهي ;
- الذي / التي ;
- الموت / الحوت ;
- قدير / كبير ;
- خلق / علق ;
- علي / عسي.

La liste complète est dans `C:\masari-data\nuit\paires-confondues-67-114.json`.

**Vérification par injection dans le suivi en ligne** (phrases exactes, une seule substitution chacune) : **les 7 substitutions proches passent pour justes (0/7 signalées)**. Le contrôle éloigné (أحسن → أكثر) est bien signalé.

| Cas | Signalé en v42 ? |
|---|---|
| 67:1 قدير → كبير | non |
| 67:2 الموت → الحوت | non |
| 67:2 وهو → وهي | non |
| 67:3 الذي → التي | non |
| 67:3 الرحمن → الرحيم | non |
| 67:3 خلق → علق | non |
| 67:4 حسير → كبير | non |
| 67:2 أحسن → أكثر (contrôle) | **oui** |

C'est exactement le genre de confusion qu'on fait en hifz (وهو/وهي, الذي/التي, fins d'aya en -ير).

## Prototypes mesurés (en mémoire de la page seulement)
`wcost` a été enveloppée le temps du test, puis la page a été rechargée. `app.js` n'est pas modifié. Script : `C:\masari-data\nuit\scripts\proto_tol.py`.

| Variante | Substitutions proches signalées | Fausses alertes sur texte exact (15 cas sans erreur) | Fausses alertes sur les vraies transcriptions Google (2 séances de Salmane) |
|---|---|---|---|
| v42 actuelle | 0/7 | 0 | 0 (plus l'ajout « والعيش », correctement signalé) |
| A : mots de 4 lettres ou moins exacts | 7/7 | **39** (« على/عليا », « ترى/تريا » : graphie uthmani) | 6 |
| C : graphie repliée (ا ى ء ة) identique = juste ; sinon mots de 3 lettres repliées ou moins exacts | 3/7 | **0** | 1 (« رجوما ») |
| D : C + même première et dernière lettre exigées pour les mots proches | **7/7** | 1 (« والحيوٰة » uthmani contre « والحياة ») | 3 (« ليبلوكم » déformé par Google, « رجوما », « والحيوة ») |

## Proposition au chef
- Partir de **D**, en ajoutant au repli de graphie les écritures uthmani en wâw : حيوة/حياة, صلوة/صلاة, زكوة/زكاة.
- Re-mesurer ensuite avec ce même script : il suffit d'ajouter la variante dans `VARIANTES`.
- But : 7/7 sur les substitutions proches, 0 fausse alerte sur texte exact, et au plus 1 sur les séances Google.

## Pas testé
D'autres sourates que 67 pour l'injection, et des séances réelles au-delà des 2 de Salmane.
