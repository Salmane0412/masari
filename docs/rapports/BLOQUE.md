# Tâches bloquées : elles ont besoin de Salmane (nuit du 15/11/2026)

| Tâche | Pourquoi c'est bloqué | Ce que Salmane doit faire |
|---|---|---|
| ~~Tournée, point 6~~ (accessibilité activée par Salmane le 15/11 au matin ; fermeture forcée testée : rapport matin-2) | Sur le téléphone, l'état natif lu par `MasariNative.status()` renvoie `accessibility:false`, et `settings get secure enabled_accessibility_services` = `null`. Le service de blocage n'a jamais été activé sur ce téléphone, il n'y a donc rien à tester. Un redémarrage demanderait de plus le code de déverrouillage, que je ne dois pas saisir. | Activer « خدمة الحجب » dans Masari (Paramètres → Accessibilité → Masari ; si le bouton est gris : Applications → Masari → ⋮ → « Autoriser les paramètres restreints »), puis me laisser redémarrer le téléphone une fois, quand tu es là pour le déverrouiller. |
| D : comparer l'horodatage aux segments QUL | Les téléchargements de QUL demandent un compte. | Rien d'urgent : les segments publics de Quran.com, sans compte, ont servi de référence à la place (rapport D). Crée un compte QUL seulement si tu veux aussi d'autres récitateurs ou la morphologie. |
| ~~Compteurs d'erreurs gonflés par les tests~~ (fait le 15/11 au matin, rapport matin-1) | Dans les données de Masari sur ton téléphone, `errors` contient 67:2 (n = 3) et surtout **67:3 (n = 25, ok = 5)**. Ces erreurs viennent en grande partie des séances de test du 14/11 et de cette nuit. C'est pour cela que l'unité 224 affiche « في هذا المقطع 1 آية تتعثّر فيها ». Toutes les données ont été remises à l'état d'avant mes tests de 01 h 15 (sauvegarde vérifiée identique), mais ces compteurs dataient d'avant. | Me dire si je remets à zéro ces deux entrées (67:2, 67:3). Je ne l'ai pas fait seul : ce sont tes données. |
| Tournée, point 7 : batterie sur 10 min de suivi | Le téléphone est sur le secteur toute la nuit (`AC powered: true`), la batterie monte au lieu de descendre. | Rien à faire maintenant. Pour mesurer la consommation, il faudra une séance sans chargeur, de jour. |

## Matin du 15/11
| Tâche | Pourquoi c'est bloqué | Ce que Salmane doit faire |
|---|---|---|
| ~~Réactiver la protection~~ (fait par Salmane ; vérifié : service activé et lié, `accessibility: true`) | Le test de fermeture forcée (rapport matin-2) a coupé le service d'accessibilité, et Android ne le rétablit pas. | Dans Masari, rouvrir « خدمة الحجب » et appuyer sur « تفعيل ». |
| Blocage après redémarrage | Ton code de déverrouillage est nécessaire après le redémarrage. | Me dire « je suis là » : je lance le redémarrage par adb et je mesure. |
| Blocage effectif d'une app | La seule règle active vise Telegram, que je ne dois pas ouvrir. | Me dire quelle app je peux ouvrir pour vérifier qu'elle est bloquée, ou l'ouvrir toi-même devant moi. |
| Pause de waqf et coupure de phrase (rapport matin-5) | L'audio joué par le haut-parleur du PC n'est pas transcrit par Google ; il faut une vraie voix près du téléphone. | Réciter 67:1–67:2 devant le téléphone, avec une pause d'environ 2 s au waqf ; je lance l'écoute et je mesure. |
