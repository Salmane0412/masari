# Méthode de travail multi-agents (Masari)

Principe : chaque agent a un rôle, des dossiers dont il est responsable, et rend un rapport écrit. Les agents ne se parlent pas directement ; le dépôt GitHub est leur canal commun (`docs/TASKS.md` pour les consignes, `docs/rapports/` pour les résultats). Le chef d'orchestre (session cloud) lit les rapports avec `git fetch`, tranche, et met à jour les consignes. L'utilisateur n'a qu'à dire « elle a fini ».

## Rôles
1. **Chef d'orchestre** (session cloud) : priorités, code de l'application web, fusion des travaux, journal, critique des demandes.
2. **Testeur** (session Claude Code locale sur le PC, avec émulateur) : exécute les tests réels (audio de récitation, captures d'écran, mesures) et écrit `docs/rapports/AAAA-MM-JJ-testeur.md`. Ne modifie pas le code de l'application sans consigne.
3. **Données du mushaf** (session locale, accès internet libre) : télécharge et convertit les données (texte Madani avec waqf, horodatages mot à mot, morphologie), vérifie les licences, range dans `data-local/` (non publié) ou dans le dépôt seulement si la licence le permet.
4. **Blocage Android** (revue de sécurité du blocage) : audite `android/` (BlockerService, VpnGuard, Policy, Partner, WhyActivity), liste les failles et leurs correctifs. Le rapport est privé (jamais dans le dépôt public) ; seul le délai de 24 h reste comme chemin de déblocage.
5. **Recherche** (à la demande) : compare des solutions (modèle de reconnaissance coranique, outils libres) et rend une recommandation chiffrée.

## Règles communes
- Chaque rapport dit : ce qui a été testé réellement, ce qui ne l'a été qu'en simulation, les mesures, et ce qui demande une action de l'utilisateur.
- Aucun secret, jeton, donnée personnelle, livre ou vidéo protégés dans le dépôt public.
- Une branche par agent ; seul le chef d'orchestre fusionne dans `main`, après tests (`for t in tests/*.test.js; do node $t; done`).
- Pas de nouveau module tant que les tests réels du module précédent ne sont pas rendus.
