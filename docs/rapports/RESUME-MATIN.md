# Résumé du matin, 15/11/2026 (Testeur)

Base testée : `main` à `9bcb729`, fusionnée dans `testeur`. APK de la release `apk` reconstruit à 07 h 50 UTC et installé. Site **`masari-v43`**.

| # | Tâche | Résultat | Rapport |
|---|---|---|---|
| 0 | Remise à zéro de 67:2 et 67:3 | ✅ Sauvegarde, puis suppression des 2 entrées, vérifiée après rechargement. Mes tests les avaient ensuite réécrites (67:1 à 67:22) : `errors` a été **restauré et vérifié**, et rien d'autre n'avait changé. | matin-1 |
| 1 | Code et APK à jour | ✅ `masari-v43`. 7/7 tests unitaires, 19/19 cas de replay. | matin-1 |
| 2 | Blocage | Redémarrage ✅ (le service se relie seul). Fermeture forcée ❌ : elle **coupe** l'accessibilité, la réouverture ne la rétablit pas, et le gardien reste muet jusqu'à la prochaine alarme (12 h 26). **Protection actuellement coupée : à réactiver.** | matin-2 |
| 3 | Rejeu des bancs | ✅ Oublis 0 % → **98,6 %**, ajouts 99,7 %, mots proches 4/7. ❌ **930 fausses alertes** sur une récitation parfaite de tout le Coran en graphie courante (v42 : 2). | matin-3 |
| 4 | Panneau d'erreurs | ✅ Visible au-dessus des barres dans les 4 configurations. ❌ Le mot fautif reste caché. | matin-4 |
| 5 | Silence de 3 s | ✅ Pris en compte : la séance se ferme 3,1 s après la fin de la parole, le mode multi-énoncés est actif, et une séance sans parole dure 3,1 s au lieu de 5,2. | matin-5 |
| 6 | Cas de test (web) | 15 cas proposés avec sources. 10 mesurés, dont 2 nouvelles fausses alertes et 3 trous anciens. | matin-7 |

## Fausses alertes nouvelles en v43 (à corriger en premier)
1. **Alif suscrit** : ذلك, هذا, هذه, لكن, إله, صراط, ضلال… sont comptés faux quand ils sont récités juste. **930** sur une récitation parfaite de tout le Coran (2 en v42).
2. **« و » initial ou mot coupé par Google** : « وهل »/« هل », « نيه بلوكم »/« ليبلوكم », « لا »/« لها ». Ce sont 2 nouvelles fausses alertes sur ta vraie séance « والعيش ».
3. **Arrêt « قف » à tort, désormais en 67:2** (« أحسن » perdu par Google entre deux phrases), au lieu de 67:3 en v42.
4. Par effet de bord, **« النظر » n'est toujours pas rattrapé** sur ta vraie séance : « وهل » ne vaut plus « هل », ce qui bloque la règle du mot manquant.

## Ce qui demande ton action (voir `BLOQUE.md`)
1. ~~Réactiver « خدمة الحجب »~~ : fait. Vérifié ensuite : service activé et lié, `accessibility: true`.
2. ~~Redémarrage~~ : testé à 09 h 23. **Le blocage tient** : le service reste activé et se relie seul environ 13 s après le démarrage, sans ouvrir Masari.
3. Me dire quelle **app de test** je peux ouvrir pour vérifier qu'une app bloquée l'est vraiment (pas Telegram).
4. **Réciter 67:1–2 avec une pause de waqf d'environ 2 s**, pour vérifier que la phrase n'est pas coupée.

## État laissé sur le téléphone (vérifié à 09 h 32)
- `errors` = les 5 entrées d'après la remise à zéro.
- Aucune écoute en cours.
- Rotation automatique remise (`1`).
- Accessibilité **réactivée par Salmane** : vérifiée ensuite. Le compteur natif `events.protect` est passé de 2 à 6 entre-temps, signe que le gardien a enregistré les coupures (le détail des moments n'est pas visible).
