# Midi — 4, 5, 6. Plan, thème, gardien (15/11/2026, 11 h 00 – 11 h 15), v46 sur le téléphone

## 4. Onglet الخطة : texte des quarts à côté de leur case
Mesure dans la page : position du texte, débordement, chevauchement avec la case, élément réellement visible au centre du texte. Captures `C:\masari-data\midi\midi-plan-rot0.png` et `…rot1.png`.

| Orientation | Quarts mesurés | Texte coupé | Chevauche la case | Lisible |
|---|---|---|---|---|
| Portrait (432 px) | 6 (« البقرة 177 – 188 » …) | 0 | 0 | **oui**, les 6 |
| Paysage (924 px) | 6 | 0 | 0 | **oui**. Les 4 quarts marqués « non visibles » sont simplement plus bas dans la page (vérifié sur la capture) |

**OK**. La capture en paysage montre « ☑ البقرة 177 – 188 » et « ☐ البقرة 189 – 202 » côte à côte, en entier.

## 5. Thème « المظهر » (Paramètres)
| Choix | `data-theme` | Valeur enregistrée | Fond de page | Texte |
|---|---|---|---|---|
| 🌙 داكن | `dark` | `dark` | rgb(11, 20, 27) | rgb(231, 240, 241) |
| ☀️ فاتح | `light` | `light` | rgb(242, 245, 244) | rgb(19, 35, 42) |
| تلقائي | (aucun) | `auto` | rgb(11, 20, 27), le téléphone étant en mode sombre | clair |

- **Persistance** : thème `light` choisi, puis **fermeture forcée** de Masari et réouverture. Le thème est toujours `light`, avec le fond clair : **OK**.
- **Lisibilité des 5 onglets** (contraste WCAG mesuré dans la page) :

  | Thème | Libellés de la barre d'onglets | Textes sous le seuil de contraste |
  |---|---|---|
  | Sombre | **8,0** (9,7 pour l'onglet actif) | **0** sur اليوم, الخطة, الحفظ, العلم, أنا |
  | Clair | **4,0**, sous le seuil de 4,5 pour du texte de 11 px | Mêmes signalements que la nuit. Les valeurs de 1,3 sont de faux résultats de l'outil (fond semi-transparent) : texte lisible sur la capture |

  **En clair, les libellés des onglets restent un peu pâles** : gris sur blanc, à 4,0. Suggestion : foncer leur couleur, ou passer à 12 px.
- Le thème choisi pour le test (`light`) a été remis ensuite à la valeur d'origine de Salmane (`auto`).

## 6. Gardien du service d'accessibilité
Masari fermé de force à **11:05:06** (`am force-stop`). Le service d'accessibilité est retiré par Android dans la seconde (`enabled_accessibility_services` vide).

| Délai | Masari | Notification « الحماية متوقفة » |
|---|---|---|
| 0 à 195 s | fermé | **aucune** |
| 195 s : réouverture de Masari à 11:08:24 | ouvert | — |
| 195 à 396 s | ouvert | **aucune** |

- **En 6 min 36 s, aucune notification**, même après réouverture. Le gardien (`Watchdog.check`) ne tourne qu'à la réception d'une alarme de Masari ou au démarrage du téléphone. Or la fermeture forcée annule les alarmes, et après réouverture `dumpsys alarm` n'en compte plus que **2** pour Masari (contre 52 après le redémarrage de ce matin).
- **Délai réel** : inconnu. Il dépend de la prochaine alarme programmée.
- **Partenaire** : aucune alerte ntfy pour cette coupure (vérifié sur le canal).
- **Inchangé depuis le rapport matin-2** : le chef n'a pas modifié le gardien entre `9bcb729` et `9487965`.

**Proposition (au chef)** :
1. lancer `Watchdog.check` à l'ouverture de Masari (`MainActivity.onResume`) ;
2. reprogrammer toutes les alarmes à l'ouverture ;
3. afficher dans l'app un bandeau « الحماية متوقفة » tant que `accessibility` est faux.
