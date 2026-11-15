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
- Le blocage effectif d'une application : il faudrait ouvrir une app bloquée. La seule règle active vise Telegram, que je ne dois pas ouvrir. Ajouter une app de test serait un durcissement, et son retrait prendrait 24 h.

## Après le test
Le service coupé par la fermeture forcée a été **réactivé par Salmane**. C'est vérifié : il est activé, lié, et `accessibility: true`.

## Redémarrage du téléphone (testé à 09 h 23, avec Salmane présent pour déverrouiller)
| Moment | Service activé (`enabled_accessibility_services`) | Service lié (`dumpsys accessibility`) | Écran |
|---|---|---|---|
| 09:23:52, avant `adb reboot` | oui | oui | déverrouillé |
| 09:24:27, fin du démarrage (`sys.boot_completed = 1`) | **oui** | non (pas encore) | écran de verrouillage |
| 09:24:40 et mesures suivantes jusqu'à 09:25:27 | **oui** | **oui** | déverrouillé |

- **Le blocage tient après un redémarrage** : le service reste activé, et Android le relie de lui-même environ 13 s après la fin du démarrage, juste après le déverrouillage. Il n'a pas fallu ouvrir Masari : le processus de Masari démarre seul.
- Les alarmes de Masari sont reprogrammées au démarrage (52 entrées dans `dumpsys alarm`).
- Aucune fausse alerte « 🛡 الحماية متوقفة » : le gardien voit bien le service actif.
- Pendant les 13 s entre la fin du démarrage et le déverrouillage, le service n'est pas encore lié. C'est sans effet pratique, puisque l'écran est verrouillé.

**Conclusion du point 6 de la tournée** :
- redémarrage : **OK** ;
- fermeture forcée : **KO** (voir plus haut). Le service est retiré et rien ne le rétablit ni n'alerte avant la prochaine alarme.
