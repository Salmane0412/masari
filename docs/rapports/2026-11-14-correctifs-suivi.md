# Correctifs du suivi de lecture après le rapport de test du 14/11/2026

Cas du rapport (unité 224, Al-Mulk) rejoués avec `tests/follow-replay.pw.js` : tous passent (9/9) sur la logique ; la précision de la reconnaissance vocale elle-même n'est pas concernée.
1. Fausse répétition / fausse erreur quand deux ayas commencent par les mêmes mots (67:2 et 67:3) : la répétition n'est retenue que si le retour en arrière s'aligne mieux (plus longue suite de mots concordants) que la suite normale.
2. Départ au milieu : on cherche la plus longue suite concordante dans tout le passage, au lieu du premier mot qui ressemble.
3. Substitution non détectée : une ou plusieurs mots entendus qui ne correspondent à rien, suivis du bon mot attendu, sont marqués faux (un mot simplement manquant reste toléré).
4. Alif khanjariyya : les mots attendus l'écrivent désormais comme un alif (سماوات), comme le fait la reconnaissance vocale ; avant, ils ne correspondaient pas.
Non testé : audio réel (voir rapport local du testeur).

## Ajout (log réel du téléphone, unité 18 = Al-Baqara 2:272…)
Le log du téléphone (reconnaissance Google d'Android) montre qu'un résultat final peut recommencer par la fin du précédent (ici « تنفقوا من خير يوف اليكم »). L'application comptait 2 fautes fantômes (« وانتم », « لا »). Correctif : un retour sur une suite d'au moins 3 mots déjà passés (dans les 12 mots précédents) qui s'aligne mieux que la suite attendue est traité comme une reprise, pas comme une erreur. Rejeu du log : 64 mots justes, 0 faute (avant : 62 justes, 2 fautes fantômes).
