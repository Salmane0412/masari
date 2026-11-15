# Nuit — E3. Arrêt « قف » : prototype mesuré (15/11/2026, ~01 h 40)

## Problème (rappel de la tournée, KO en v42)
Sur une récitation juste, Google rend « رضيع البصر » au lieu de « فارجع البصر ». C'est le premier mot d'une nouvelle séance de reconnaissance, qui redémarre environ toutes les 4 s. Masari s'arrête alors en 67:3.

`wcost` ne permet pas de distinguer ce cas d'une vraie substitution. Mesuré sur le téléphone : `wcost` vaut **1** pour « فارجع/رضيع » comme pour « أحسن/أكثر » ou « البصر/النظر », et **0,4** pour « كبير/قدير » comme pour « فارجع/فرجع » : la fonction ne renvoie en pratique que ces deux valeurs.

## Règle B
Ne pas s'arrêter quand toutes ces conditions sont réunies :
- le mot faux est **le premier mot attendu au début de la nouvelle phrase** reconnue ;
- les **3 mots suivants sont justes**.

Le mot excusé le reste ensuite. Il pourrait être affiché « à vérifier » plutôt que « faux ».

Simulation phrase par phrase, avec la vraie fonction `followEval` de la v42 dans la WebView du téléphone. Script : `C:\masari-data\nuit\scripts\proto_qif.py`.

| Cas | Attendu | v42 actuelle | Règle B |
|---|---|---|---|
| Juste, 1er mot mal reconnu (« رضيع ») | pas d'arrêt | **arrêt en 67:3 فارجع** ✗ | pas d'arrêt ✓ |
| Juste, 1er mot coupé (« رجع ») | pas d'arrêt | pas d'arrêt ✓ | pas d'arrêt ✓ |
| Juste, parfait | pas d'arrêt | ✓ | ✓ |
| Erreur réelle « النظر » (2e mot de la phrase) | arrêt | arrêt ✓ | arrêt ✓ |
| Erreur réelle « أكثر » | arrêt | arrêt ✓ | arrêt ✓ |
| Vraie séance Google « والعيش » | arrêt | arrêt ✓ | arrêt ✓ |
| Vraie séance Google « النظر » (mot perdu par Google) | arrêt | pas d'arrêt ✗ | pas d'arrêt ✗ (voir la règle « mot manquant », rapport E) |
| Erreur sur le 1er mot d'une phrase (« لم » pour « ثم », « التي » pour « الذي ») | arrêt | pas d'arrêt ✗ (tolérance, rapport E2) | pas d'arrêt ✗ |

**Bilan** : la règle B supprime la fausse alerte mesurée sans perdre aucune détection que la v42 obtient aujourd'hui.

**Prix** : une vraie erreur sur le **premier mot** d'une phrase reconnue ne déclencherait plus l'arrêt (seulement « à vérifier »). Les deux exemples testés ne l'arrêtaient de toute façon pas en v42.
