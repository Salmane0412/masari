# Nuit — J. Reconnaissance vocale Android : ce que disent les journaux (15/11/2026, ~02 h 30)

Ce test est hors de la file A–H, mais il touche directement la priorité n° 1, le suivi de récitation.

## Méthode (testée réellement)
- Une séance de suivi de 30 s a été lancée dans Masari, sur le téléphone, au calme.
- Le journal Android a été lu pendant la séance (`adb logcat`, service de reconnaissance Google, `com.google.android.tts`).
- `SpeechBridge.kt` a été lu dans le dépôt (`main` à `a1122ad`).

## Constats
1. **Le réglage de silence de Masari est ignoré.** `SpeechBridge.kt:69` envoie `EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS` en **`3000L` (Long)**. Le service de Google le refuse, et le journal l'écrit en toutes lettres :
   > Key android.speech.extras.SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS expected Integer but value was a java.lang.Long. The default …

   C'est donc la valeur par défaut de Google qui s'applique. Or le tajwid comporte de longs madd et des pauses de waqf ; une coupure trop tôt fait perdre des mots aux jonctions entre séances (rapport du 14/11).
   **Correction proposée** (au chef, dans `android/`) : `putExtra(…, 3000)` en `Int`. Tester ensuite 3 000 puis 5 000 ms, avec la voix de Salmane.
2. **Durée d'une séance sans parole** : **5,15 à 5,23 s** (6 séances), puis `NO_SPEECH_DETECTED` et redémarrage. **Délai mesuré entre la fin d'une séance et le début de la suivante, côté service : environ 20 ms.** Le temps mort au redémarrage est donc négligeable, ce qui confirme les 148 redémarrages en 10 min de la tournée. La perte de mots vient de la **fin** de séance, pas du redémarrage.
3. **Pas de reconnaissance hors ligne en arabe sur ce téléphone.** Google lance en parallèle un reconnaisseur hors ligne (SODA), qui échoue à chaque séance :
   > Returning no LP, as MDD does not support locale: ar-SA … Failed to get language pack of required locale: error 12

   **Le suivi de récitation exige donc une connexion.** Combiné au constat du rapport B (écoute et examen hors ligne sans message), Masari n'a **pas de mode hors ligne** pour le Coran à voix haute.
   - Piste : le modèle Coran local (rapports F et D) est la seule voie hors ligne.
   - Au minimum, afficher « pas de connexion : le suivi vocal ne marche pas hors ligne ».

## Pas testé
- D'autres locales arabes (ar-EG, ar-AE…) : elles pourraient avoir un pack hors ligne. Il faudrait aller dans les réglages de reconnaissance du téléphone, que je n'ai pas touchés.
- L'effet réel d'une valeur `Int` : il faut reconstruire l'APK, c'est au chef de le faire.
