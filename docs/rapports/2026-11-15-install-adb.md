# Mise à jour de Masari par adb (15/11/2026, 20 h 20)

Mission : installer la dernière version **par-dessus** l'application existante (`adb install -r`). Pas de désinstallation, pas d'effacement de données, aucun fichier de code modifié.

| Étape | Résultat |
|---|---|
| 1. `adb devices` | `ZY22D3QV36  device` : téléphone vu et autorisé |
| Avant l'installation | `versionName=2.3`, `lastUpdateTime=2026-11-15 10:34:39` |
| 2. Téléchargement de `Masari.apk` (release `apk`, pas `Masari-lite.apk`) | **889 247 octets (0,85 Mo)**, SHA-256 `22D136580A600299…`, en-tête `PK` (archive valide). C'est **moins de « plusieurs Mo »**, mais c'est exactement la taille que GitHub publie pour ce fichier (release du 15/11 à 18 h 42 UTC), et tous les APK de Masari de la journée faisaient environ 0,88 Mo. Le fichier est donc complet. |
| 3. `adb install -r` | **`Success`** |
| 4. Contrôle | `versionName=2.3`, `versionCode=6`, **`lastUpdateTime=2026-11-15 20:20:23`** |

Aucune erreur. Le numéro de version reste 2.3 (versionCode 6), comme pour toutes les constructions de ce jour : seule la date de mise à jour permet de voir le changement.

Non vérifié : le contenu du site chargé après la mise à jour (version du service worker), car ce n'était pas demandé. L'état du service d'accessibilité après l'installation n'a pas été relevé non plus.
