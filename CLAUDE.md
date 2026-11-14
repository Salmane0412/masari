# Masari (مساري) — mémo technique pour Claude Code

Application personnelle universelle (Coran/hifz, suivi de récitation, santé, sport, prière, finances, tâches, études, blocage). Dépôt public : aucune donnée personnelle, aucun secret, aucun token dans ce dépôt.

## Règles de travail
- Tout faire soi-même ; ne demander à l'utilisateur que ce que lui seul peut faire (secrets, comptes).
- Solutions gratuites d'abord (hébergement payant seulement après épuisement des options gratuites).
- Dire honnêtement ce qui a été réellement testé et ce qui ne l'a pas été.
- Le blocage doit tenir : ne jamais proposer de contournement ; seul le chemin avec délai de 24 h est acceptable.
- Les textes générés au nom de l'utilisateur doivent paraître humains.
- Ne jamais ouvrir ni consulter Telegram sans autorisation explicite.

## Architecture
- PWA en JS vanilla : `index.html`, `app.js` (état `S` dans `localStorage` clé `masari.v1`, routeur par hash, `views.*`, `route()`), modules `*ui.js` par fonctionnalité.
- `sw.js` : réseau d'abord ; incrémenter `V` à chaque changement et lister tout nouveau fichier dans `SHELL`.
- `ideas.js` : journal de diagnostic (`DIAG`, `localStorage masari.diag`) et boîte à idées.
- `locate.js` : prototype de localisation dans tout le Coran (non branché à l'interface).
- Android (`android/`) : WebView `MainActivity`, `NativeBridge` (`MasariNative`), `SpeechBridge`, `BlockerService` (accessibilité), `VpnGuard`, `WhyActivity` (déverrouillage par copie exacte d'un texte fixe). Build via GitHub Actions `android.yml` (release `apk`).

## Tests
`for t in tests/*.test.js; do node $t; done`
Tests UI : `python3 -m http.server 8765` + Playwright Chromium (émulation Pixel 7).

## Suivi de récitation (priorité n°1)
- Constat : la reconnaissance vocale générique du navigateur/Android n'est pas spécialisée Coran → précision insuffisante.
- Plan : modèle local Whisper affiné Coran (ONNX / transformers.js), fenêtre glissante ~8 s, normalisation du texte, alignement de type Needleman-Wunsch, suivi près de la dernière position puis recherche large (`locate.js`).
- Exigences : répéter une aya revient à son début sans compter d'erreur ; indice (mot suivant) après un silence ; la basmala ne doit jamais faire sauter vers une autre sourate ; ouvrir le Mushaf et lire doit retrouver la position automatiquement.
- Tests réels : fichiers audio de récitation injectés comme micro (émulateur Android / Chrome fake audio).

## Feuille de route
1. Suivi de récitation robuste + localisation libre.
2. Synchronisation automatique (liaison par QR code, dépôt privé séparé).
3. Santé : sport, nutrition (Open Food Facts, photo/texte/voix), sommeil, Health Connect, balance Bluetooth.
4. Écran d'accueil sobre + audit de design.
5. Lecteur PDF de livres + fawa'id.
6. Veille RSS filtrée et réglable (fr/en/ar, thèmes).
7. Application Windows (blocage, recherche locale).
8. Version pour la conjointe (contrôle partenaire).
9. Modules طلب العلم (comparateur d'éditions, schéma des sciences, cours, calculateur d'héritage, scanner halal), tableau de bord OSINT, détection de contenu par IA.

## Mushaf interactif (à faire, nécessite un accès réseau libre : la session cloud ne peut pas télécharger ces données)
Objectif : cliquer un verset (tafsir…), un mot (infos du mot), une lettre (prononciation, règles de tajwid) ; waqf/ibtida identiques au Mushaf de Médine ; mushaf de tajwid universel (Hafs d'abord, autres riwayat ensuite).
Sources identifiées : Quranic Universal Library (qul.tarteel.ai, « Download Resources ») : horodatage mot par mot (« recitation with segments », Al-Husary inclus, format `[index_mot, début, fin]`), mises en page de mushaf, textes Madani/Uthmani (dont tajwid), tafsirs, morphologie, traductions mot à mot. Vérifier les conditions d'utilisation avant de les empaqueter. Le texte actuel (`data.js`) n'a pas les signes de waqf (ۖ ۗ ۘ ۙ ۚ ۛ) : les ajouter depuis une source Madani avant de rendre le mushaf.
Couleurs de tajwid : le mushaf de Dar al-Ma'rifa utilise trois familles (rouge, vert, bleu) en plusieurs teintes, gris pour les lettres non prononcées ; sa légende exacte n'est pas publique en ligne : à lire sur la première page du mushaf de l'utilisateur.

## Légende de tajwid de référence (mushaf Dar al-Ma'rifa, relevée sur la page d'explication du mushaf de l'utilisateur)
Rouge foncé = madd lâzim 6 ; rouge rosé = madd wâjib muttasil/munfasil 4–5 ; rouge orangé = madd jâ'iz 2/4/6 (âridh, lîn) ; rouge cumin = madd de 2 (alif/wâw/yâ' petits de la graphie ottomane) ; vert = ghunna 2 (idghâm bi-ghunna, ikhfâ', iqlâb, nûn/mîm mouchaddadah) ; gris = non prononcé (lâm shamsiyya, idghâm sans ghunna, hamzat wasl…) ; bleu foncé = tafkhîm (isti'lâ', râ', lâm de Allah) ; bleu clair = qalqala. Appliqué dans `TJ_DEF` (app.js). Restent à faire : râ' et lâm de Allah (tafkhîm conditionnel), distinction fine des madd.
Signes de waqf du même mushaf : م (lâzim), صلى (wasl plus apte), قلى (waqf plus apte), ج (jâ'iz), ∴ (mu'ânaqa) ; autres signes : sajda, début de hizb/juz, fin d'aya avec numéro.
Livres de référence de l'utilisateur : « التجويد المصور » du Dr Ayman Rushdi Suwayd (Dar Al-Ghawthani) : schémas des makhârij et QR codes vers des vidéos. Ne pas recopier ses images ni son texte : faire des schémas originaux et pointer vers les liens publics (l'utilisateur peut les fournir).
