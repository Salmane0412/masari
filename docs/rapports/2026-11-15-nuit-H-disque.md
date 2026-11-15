# Nuit — H. Espace disque sur C: (15/11/2026, ~01 h 35)

C: fait 121 Go, avec **2,6 Go libres** (98 % occupé), mesuré par `df`. **Rien n'a été supprimé.** Les tailles viennent de `du` ; les fichiers personnels (Documents, Images, Bureau, Téléchargements) n'ont pas été parcourus.

| Emplacement | Taille | Origine | Proposition |
|---|---|---|---|
| `C:\pagefile.sys` | 7,5 Go | Fichier d'échange de Windows (7,4 Go de RAM) | Le laisser géré par Windows. On peut le réduire à environ 4 Go fixes, au risque de manquer de mémoire avec Chrome et les modèles. |
| `C:\hiberfil.sys` | 3,2 Go | Hibernation et démarrage rapide | `powercfg /h off` (à lancer en administrateur) libère 3,2 Go, mais supprime l'hibernation. |
| `AppData\Local\Android\Sdk\system-images\android-34` + `emulator` | **3,1 + 1,1 Go** | Installés le 14/11 pour l'émulateur, abandonné ensuite (pas d'accélération, disque insuffisant) | **À supprimer en priorité** : 4,2 Go, plus l'AVD `Pixel7` dans `.android\avd`. `platform-tools` (adb, 17 Mo) suffit pour le téléphone. Je ne l'ai pas fait : la règle de la nuit interdit toute suppression. |
| `AppData\Local\Packages` | 5,2 Go, dont **4,6 Go pour l'application Claude** (`Claude_pzs8sxrjxfjjc`) et 0,36 Go pour la recherche Windows | Applications du Microsoft Store | Ne pas toucher au dossier de Claude pendant les sessions. |
| `AppData\Local\Google` | 4,9 Go, dont 4,9 Go pour `Chrome` | Chrome (cache et profil) | Vider le cache de Chrome (le profil est personnel). |
| `.cache\whisper` (`medium.pt` 1,5 Go, `small.pt` 0,5 Go) | 1,9 Go | Modèles openai-whisper datés du **25/09**, avant ce projet : **probablement à toi** | À supprimer seulement si tu ne t'en sers plus. Masari utilise faster-whisper, pas ces fichiers. |
| `.cache\huggingface` | 1,8 Go | Modèles faster-whisper. `faster-whisper-medium` est daté du 26/09 (avant ce projet) ; le modèle Coran (environ 150 Mo) et `base` sont utilisés par les tests | Garder le modèle Coran ; `medium` (environ 1,5 Go) est sans doute supprimable. |
| `Windows\Installer` | 2,5 Go | Windows | Ne pas y toucher à la main. |
| `AppData\Local\Microsoft` | 2,4 Go | Edge, Office, OneDrive… | Nettoyage de disque de Windows. |
| `AppData\Local\Temp` | 0,7 Go | Fichiers temporaires (dont ce scratchpad de session) | Nettoyage de disque de Windows. |
| `AppData\Local\pip` | 0,36 Go | Cache pip | `pip cache purge`. |
| `C:\masari-data` | 120 Mo | Données de test | Garder. |

**Total facilement récupérable** : environ 4,2 Go (émulateur), plus 3,2 Go (hibernation) et 1,5 à 3,4 Go (anciens modèles whisper, si tu confirmes qu'ils ne servent plus).
