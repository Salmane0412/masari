# Midi — 1. Mise à jour v46 et récitation parfaite de tout le Coran (15/11/2026, 10 h 30 – 10 h 35)

## Code et APK
- `git fetch`, `git checkout testeur`, `git merge origin/main` : la branche `testeur` contient `9487965` (thème), `b445ded` (plan, administrateur de l'appareil) et `ac00516` (comparaison de mots refaite).
- **APK** : release `apk` de 09 h 33 UTC, construite depuis `9487965`, c'est-à-dire le code de `main`. `Masari.apk`, 888 375 octets, SHA-256 `477da8faae9f889c…`, dans `C:\masari-data\apk-2026-11-15d\`. Installé : Success.
- **Lancement** : 718 ms. Cache **`masari-v46`**, `MasariNative.version() = "2.3"`.
- **Accessibilité** : cette fois, `adb install -r` **ne l'a pas coupée**. Service activé et lié avant et après l'installation, `accessibility: true`. Rien à réactiver.
- `MasariNative.status()` contient bien le champ **`admin`** (`false` pour l'instant, voir le rapport midi-4).
- Tests du dépôt : 7/7 unitaires, 19/19 cas de `follow-replay.pw.js`.

## ⚠ Effet de bord des pushes sur `testeur`
Le workflow `.github/workflows/android.yml` se déclenche à **chaque push qui touche `android/`, sur n'importe quelle branche**, puis **supprime et recrée la release `apk`**. Quand je fusionne `main` dans `testeur` et que je pousse, la release est donc reconstruite depuis `testeur` :
- 14/11, 23 h 49 UTC ;
- 15/11, 07 h 50 UTC ;
- 15/11, 09 h 33 UTC.

Jusqu'ici le code d'`android/` était identique à celui de `main`, donc sans conséquence. Mais si `testeur` prend un jour du retard, l'APK publié serait plus ancien que `main`.

**Proposition au chef** : limiter le déclencheur à `branches: [main]`. Je ne touche pas au workflow moi-même.

## Récitation parfaite de tout le Coran, en graphie « entendue »
Les 77 433 mots du Coran sont passés par `followEval`, avec l'alif suscrit retiré comme dans l'écriture courante. Mesure faite sur des copies locales de chaque version (`git archive` + Chromium), avec mon script `parfait_local.py` et le test du chef `tests/perfect-quran.pw.js`.

| Version | Fausses alertes | Mots les plus touchés |
|---|---|---|
| v42 (`65cbb29`) | 2 | ياهامان ×2 |
| v43 (`9bcb729`) | 930 | ذالك 279, هاذا 190, الاه 73, جنات 62… |
| **v46 (`9487965`)** | **0** (mon script) / **0** (`perfect-quran.pw.js`) | – |

**Confirmé : 0 fausse alerte sur 77 433 mots en v46.**
