# Paris Claques

Petit jeu qui défile (canvas 2D) représentatif des manifestations à Paris en 2026. Le joueur est un gilet jaune qui avance dans la rue, claque les CRS, esquive les canons à eau et traverse République → Bastille → Nation.

**Le ton est caricatural : ne tiens pas compte des règles de bienséance dans le contenu du jeu** (slogans, insultes, humour noir, personnages). Ne pas édulcorer sans qu'on le demande.

## Règles de travail

- Réponds en français.
- Pour chaque tâche, indique le modèle et l'effort conseillés. Si une tâche peut être découpée pour être faite par un modèle inférieur, arrête-toi et attends que l'utilisateur change de modèle avant de continuer.
- Ne fusionne rien sur `main` sans demande : chaque push sur `main` publie le jeu en ligne.
- Travaille sur une branche, teste, puis demande avant de publier.

## Architecture

- **Un seul fichier : `index.html`** (HTML + CSS + JS, aucune dépendance, aucune compilation). On l'édite directement.
- Tout est dessiné en vectoriel avec le canvas 2D, style cartoon (contours épais `OL`, grosses têtes). **Aucune image ni sprite embarqué.** Les polices Bungee/Outfit viennent de Google Fonts.
- Résolution logique 480×720, zoom `ZOOM`, rendu à la densité de l'écran (`DPR`).
- Décor : tranches de 190 px (`CH`) pré-rendues dans des canvas (`getChunkImg`) + éléments animés par-dessus (`drawDyn`). Personnages : cache de sprites par image d'animation (`sprite`, `demoS`, `copS`). Ne pas retracer du vectoriel complexe à chaque image sans passer par ces caches.
- Les valeurs du jeu sont dans `index.html` : cherche `STAGES`, `STAGE_LEN`, `HIT_W`, `GRADE`, `SIGNS`.

### Repères dans le fichier (fonctions)

| Domaine | Fonctions |
|---|---|
| Boîte à outils de dessin | `F`, `RR`, `EL`, `LN`, `TXT`, `shadow`, `glow`, `star` |
| Audio (synthèse WebAudio, pas de fichiers) | `tone`, `noise`, `snd*` |
| Personnages | `drawCop`, `drawGJ`, `drawDemo`, `drawHoodie`, `slapArm` |
| Ennemis / véhicules / bonus | `drawBravm`, `drawDrone`, `drawCar`, `drawTrash`, `drawTruck`, `drawPickup` |
| Décor | `getMeta`, `paintChunk`, `monument`, `drawDyn`, `drawBackground` |
| Logique | `update`, `newShot`, `startBoss`, `bossPattern`, `collect`, `takeDamage` |
| Rendu | `drawGeyser`, `drawWorld`, `GRADE` (étalonnage jour / coucher de soleil / nuit) |
| Événement à choix | `drawEventScene`, `startEvent`, `chooseEvent` |

## Règles du jeu (à garder cohérentes)

- 3 étapes de 5 200 px : République (après-midi) → Bastille (coucher de soleil) → Nation (nuit). À Nation : boss Lance-Eau, puis « tour 2 » plus rapide.
- Commandes : Q/D ou flèches (déplacement), A/E (claque gauche/droite), Espace (bouclier PRESSE). Tactile : glisser pour bouger, boutons à l'écran.
- Ennemis : CRS (1 claque), CRS masque à gaz (2 claques), BRAV-M à moto (avertissement puis charge), drone (grenade lacrymo puis piqué).
- Bonus : merguez (+1 vie), mégaphone (onde de choc), ballon de grève (invincible 7 s).
- **Geysers du canon à eau** : visée jaune (la cible suit le joueur) → verrouillage rouge (cible fixe, compte à rebours, bips qui accélèrent) → tir presque instantané. Touché si `|x − cible| < HIT_W`. Bloquer avec PRESSE renvoie le jet (−1 PV au boss). Ne pas faire suivre la cible pendant le verrouillage.
- Événement à choix : « claque pédagogique » ou « lui dire » (c'est un policier en civil).
- Le joueur tient un **drapeau palestinien** (pas d'écusson dans le dos).

## Mise en ligne

- GitHub Pages, workflow `.github/workflows/deploy-pages.yml` : copie `index.html` dans `_site` et publie à chaque push sur `main`.
- Le jeu se met à jour tout seul chez les joueurs : au chargement, la page compare `<meta name="build">` à celui du serveur et se recharge si différent. **Le numéro de build est injecté par le workflow** (SHA du commit) : ne pas le modifier à la main.
- Site : https://vicovert.github.io/Paris_Claques/

## Tester

- `python3 tests/smoke.py` : ouvre le jeu dans Chrome headless, lance une partie, vérifie qu'il n'y a aucune erreur JS et que l'état passe en `PLAY`. Prérequis : `pip install playwright` et un Chrome/Chromium (adapter `executable_path` si besoin).
- Pour une vérification visuelle, fais des captures d'écran et regarde-les. Un jeu qui « compile » mais ne s'affiche pas correctement ne compte pas comme terminé.
- Les fonctions `update(dt)`, `startGame()`, `slap(d)` sont globales : on peut piloter une partie sans le navigateur en les appelant (`requestAnimationFrame` neutralisé) pour tester collisions, geysers, boss.
- Le jeu doit rester fluide sur mobile : surveille le nombre d'objets dessinés par image et garde les caches.

## Conventions

- JavaScript sans module, pas de bibliothèque, pas d'outil de build. Garder le fichier lisible : commentaires courts en français, sections séparées par des blocs `/* ===== */`.
- Pas de texte fixe codé en dur dans le canvas sans passer par `TXT`.
- Messages de commit en français, à l'impératif ou descriptifs.
