# Matin — 2. Blocage : accessibilité et fermeture forcée (15/11/2026, 08 h 52 – 08 h 58)

APK du `9bcb729` (gardien du service d'accessibilité), site `masari-v43`.

## Testé réellement
| Étape | Mesure | Résultat |
|---|---|---|
| Avant le test | `MasariNative.status().accessibility` | **true** |
| Avant le test | `settings get secure enabled_accessibility_services` | `app.masari.lock/app.masari.lock.BlockerService` |
| Avant le test | `dumpsys accessibility` | service **lié** (« Bound services: مساري ») |
| `am force-stop app.masari.lock` à 08:52:32 | 2 s après | **enabled = 0, bound = 0** : Android **retire Masari de la liste des services d'accessibilité activés** |
| | 30 s puis 90 s après, Masari non rouvert | toujours enabled = 0, bound = 0 : **la protection reste coupée** |
| | notification « 🛡 الحماية متوقفة » | **aucune** (`dumpsys notification` : 0) |
| Masari rouvert à 08:54 | `enabled_accessibility_services` | **`null`** : la réouverture ne rétablit pas le service |
| | `MasariNative.status()` | `accessibility: false` ; `events.protect` reste à 2 (aucun nouvel événement) |
| | alarmes de Masari (`dumpsys alarm`) | reprogrammées à la réouverture ; la prochaine est à **12 h 26** (prière) |

## Lecture
- **Le blocage ne tient pas après une fermeture forcée** : le service est coupé immédiatement et le reste.
- **Le gardien de `9bcb729` ne se déclenche pas à ce moment-là.** `Watchdog.check` ne tourne qu'à la réception d'une alarme de Masari (`AlarmReceiver`) ou au démarrage du téléphone (`BootReceiver`). Or la fermeture forcée **annule toutes les alarmes** de l'app, et Android ne livre aucune diffusion à une app arrêtée de force tant qu'elle n'est pas rouverte. Après réouverture, la première vérification n'aurait lieu qu'à la prochaine alarme : ici 12 h 26, soit **3 h 30 sans protection et sans alerte**.
- L'alerte au partenaire (`Partner.send`) n'a pas pu être vérifiée : `partner: false` sur ce téléphone, et l'alarme de 12 h 26 n'était pas encore passée à la fin du test.
- Sans contournement à proposer, voici ce que le chef pourrait renforcer :
  1. lancer `Watchdog.check` **dès l'ouverture de Masari** (dans `MainActivity.onResume`), et afficher dans l'app un écran bloquant « réactiver la protection » tant que l'accessibilité est coupée ;
  2. programmer une vérification **périodique rapprochée**, par exemple toutes les 15 min avec WorkManager ou une alarme dédiée. Elle ne survivra pas à une fermeture forcée, mais elle couvre les coupures par réglage ;
  3. noter l'heure de coupure dès la réouverture, pour que le rapport au partenaire indique la durée réelle sans protection.

## Pas testé
- **Le redémarrage du téléphone** : j'attends que Salmane me dise qu'il est là (voir `BLOQUE.md`).
- Le blocage effectif d'une application : il faudrait ouvrir une app bloquée. La seule règle active vise Telegram, que je ne dois pas ouvrir. Ajouter une app de test serait un durcissement, et son retrait prendrait 24 h.

## Ce qui demande Salmane
**Le service d'accessibilité est maintenant coupé** à cause de ce test. Il faut le **réactiver** dans Masari (« خدمة الحجب » → تفعيل), comme ce matin.
