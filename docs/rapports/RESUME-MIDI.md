# Résumé de midi, 15/11/2026 (Testeur)

Base testée :
- `main` à `9487965`, fusionnée dans `testeur` ;
- APK de la release `apk` de 09 h 33 UTC (code de `main`), installé : **`masari-v46`** ;
- accessibilité restée active après cette installation.

| # | Tâche | Résultat | Rapport |
|---|---|---|---|
| 1 | Récitation parfaite de tout le Coran (graphie entendue) | ✅ **0 fausse alerte sur 77 433 mots**, avec le test du chef et avec mon script (v43 : 930 ; v42 : 2) | midi-1 |
| 2 | Bancs v42 / v43 / v46 | ✅ Oublis 98,2 %, ajouts 98,9 %, mots proches 7/8, « النظر » **enfin détecté** sur ta vraie séance, plus d'arrêt « قف » à tort. ⚠ 2 fausses alertes restent sur tes vraies séances, aux **jonctions de phrases Google** (« إن », « خزنتها » écrit « خذلتها ») | midi-2 |
| 3 | Blocage : administrateur de l'appareil | ✅ Champ `admin` présent, administrateur **actif**, désinstallation **empêchée** (renvoi à l'accueil), alerte au partenaire reçue (ntfy, 11:21:55). ❌ **L'activation est impossible quand la protection tourne** : `BlockerService` renvoie l'écran d'activation à l'accueil et envoie une **fausse alerte** au partenaire. Il n'a pu être activé que pendant la coupure due à mon test. | midi-3 |
| 4 | Onglet الخطة | ✅ Texte des quarts entier et lisible à côté de la case, en portrait et en paysage | midi-4-6 |
| 5 | Thème « المظهر » | ✅ Change le fond et reste après fermeture forcée et réouverture. ⚠ En clair, libellés des onglets un peu pâles (contraste 4,0 au lieu de 4,5) | midi-4-6 |
| 6 | Gardien après fermeture forcée | ❌ **Aucune notification en 6 min 36 s**, même après réouverture. Seulement 2 alarmes de Masari reprogrammées. Aucune alerte au partenaire. | midi-4-6 |
| 7 | Mot fautif sous le panneau | En portrait, centrer le mot dans la zone libre (527 px) le rend visible : essai réussi, code proposé. En paysage (environ 20 px libres), il faut une autre disposition. | midi-7 |

## À signaler au chef en premier
1. **L'activation de l'administrateur** est bloquée par `BlockerService`, avec une fausse alerte au partenaire : laisser passer `DeviceAdminAdd` quand c'est l'app qui l'ouvre.
2. **Le gardien est muet** après une fermeture forcée : appeler `Watchdog.check` et `Alarms.scheduleAll` à l'ouverture de l'app.
3. **Les fausses alertes aux jonctions de phrases Google** : marquer « à vérifier », pas « faux », le premier et le dernier mot d'une phrase reconnue.
4. **Le workflow APK** se déclenche aussi sur `testeur` et republie la release `apk` : le limiter à `main`.

## Administrateur seul (testé à 11 h 35, après fermeture forcée)
« Désinstaller » reste actif. Android demande d'abord de **désactiver l'administrateur**, sans code ni délai. L'administrateur ajoute donc une étape, mais ne bloque pas. Masari est toujours installé (rien n'a été confirmé).

## Ce qui demande ton action (`BLOQUE.md`)
- **La protection est coupée depuis 11:34** (test de l'administrateur seul). La réactiver demande le code de ton épouse : c'est toi qui choisis quand. Je ne ferai plus de fermeture forcée sans ton accord.

## État laissé sur le téléphone (vérifié à 11 h 28)
- (11:28) Accessibilité activée et liée, administrateur actif. **Depuis 11:34 : accessibilité coupée** par le dernier test.
- Rotation automatique.
- Thème d'origine (automatique).
- Compteurs `errors` restaurés (7 entrées, dont tes 2 nouvelles).
