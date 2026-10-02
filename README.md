# MEANDRE [<img src="https://github.com/lou-heraut/MEANDRE/blob/3ddb682aa3fa38a18fdd36292dd8aa51e6a9d565/static/resources/logo/MEANDRE_logo.svg" align="right" width=100 height=100 alt=""/>](https://meandre.explore2.inrae.fr/)

<!-- badges: start -->
[![ASSISTED BY AI](https://raw.githubusercontent.com/lou-heraut/ai-label-badge/main/ai-label_badge-assisted-by-ai.svg)](https://ai-label.org/)
[![Lifecycle: stable](https://img.shields.io/badge/lifecycle-stable-green)](https://lifecycle.r-lib.org/articles/stages.html)
![](https://img.shields.io/github/last-commit/lou-heraut/MEANDRE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md) 
<!-- badges: end -->


[MEANDRE](https://meandre.explore2.inrae.fr/) présente de manière guidée un regard d'expert sur les résultats des projections hydrologiques réalisées sur la France. La mise à jour de ces projections a été réalisé entre 2022 et 2024 dans le cadre du projet national [Explore2](https://professionnels.ofb.fr/fr/node/1244).<br>
Ces résultats sont un aperçu de quelques futurs possibles pour la ressource en eau.

[<img src="https://github.com/lou-heraut/MEANDRE/blob/3ddb682aa3fa38a18fdd36292dd8aa51e6a9d565/static/resources/thumbnail.png">](https://meandre.explore2.inrae.fr/)

Les données produites dans le cadre du projet [Explore2](https://professionnels.ofb.fr/fr/node/1244) sont disponibles sur [DRIAS-Eau](https://drias-eau.fr/) et les rapports et messages du projet sur l'entrepôt [Recherche Data Gouv](https://entrepot.recherche.data.gouv.fr/dataverse/explore2).

Ce projet a été rendu possible grâce aux financements du projet [LIFE Eau&Climat](https://www.gesteau.fr/life-eau-climat) (LIFE19 GIC/FR/001259) qui a reçu un financement du programme [LIFE](https://aides-territoires.beta.gouv.fr/programmes/life/) de l’Union européenne dans le cadre d'un développement réalisé par l'Institut National de Recherche pour l’Agriculture, l’Alimentation et l’Environnement, [INRAE](https://agriculture.gouv.fr/inrae-linstitut-national-de-recherche-pour-lagriculture-lalimentation-et-lenvironnement).


## FAQ
📬 — **I would like an upgrade / I have a question / Need to reach me**  
Feel free to [open an issue](https://github.com/lou-heraut/MEANDRE/issues) ! I’m actively maintaining this project, so I’ll do my best to respond quickly.  
I’m also reachable on my institutional INRAE [email](mailto:louis.heraut@inrae.fr?subject=%5BMEANDRE%5D) for more in-depth discussions.

🛠️ — **I found a bug**  
- *Good Solution* : Search the existing issue list, and if no one has reported it, create a new issue !  
- *Better Solution* : Along with the issue submission, provide a minimal reproducible code sample.  
- *Best Solution* : Fix the issue and submit a pull request. This is the fastest way to get a bug fixed.

🚀 — **Want to contribute ?**  
If you don't know where to start, [open an issue](https://github.com/lou-heraut/MEANDRE/issues).

If you want to try by yourself, why not start by also [opening an issue](https://github.com/lou-heraut/MEANDRE/issues) to let me know you're working on something ? Then:

- Fork this repository  
- Clone your fork locally and make changes (or even better, create a new branch for your modifications)
- Push to your fork and verify everything works as expected
- Open a Pull Request on GitHub and describe what you did and why
- Wait for review
- For future development, keep your fork updated using the GitHub “Sync fork” functionality or by pulling changes from the original repo (or even via remote upstream if you're comfortable with Git). Otherwise, feel free to delete your fork to keep things tidy ! 

If we’re connected through work, why not reach out via email to see if we can collaborate more closely on this repo by adding you as a collaborator !


## Statistiques d'accès
Le script `access_log/stats.py` calcule des statistiques journalières de MEANDRE et MEANDRE-TRACC à partir des logs Apache. Les IP ne sont traitées qu'en mémoire : seuls des comptes par jour sont écrits dans `access_log/stats/<app>_daily.csv`. Toutes les commandes se lancent depuis le dossier du code (`make help`), l'installation est décrite dans [INSTALL.md](INSTALL.md).

| Cible | Où | Effet |
|---|---|---|
| `make stats-update` | serveur (sudo) | relit tous les logs disponibles et met à jour les CSV, lancé chaque nuit par cron (`make cron`) |
| `make stats` | serveur ou local | rapport terminal : 30 derniers jours, moyennes mensuelles, tendance sur 90 jours, jours manquants |
| `make stats-live` | serveur (sudo) | chiffres du jour en cours, rafraîchis chaque minute |
| `make stats-get` | local | rapatrie les CSV du serveur |
| `make stats-html` | local | génère `access_log/stats/report.html` (nécessite `make venv-dev`) |
| `make test` | local | vérifie le script sur des logs synthétiques |

Métriques, par jour :
- `users` : IP distinctes ayant appelé l'API de la carte (POST vers `/get_delta_on_horizon` ou `/get_delta_serie` pour MEANDRE, vers `/get_narrative_data`, `/get_narrative` ou `/define_data_palette` pour MEANDRE-TRACC) ;
- `ips` : toutes les IP distinctes, robots compris ;
- `requests` : nombre de requêtes ;
- `bot_requests` : requêtes dont le user agent se déclare robot ou outil (bot, crawl, spider, curl, python…).

`users` est la métrique principale. Ces appels ne partent que si le JavaScript de la page s'exécute et que quelqu'un utilise la carte : robots d'indexation, scanners et aperçus de liens n'en font quasiment jamais. `ips` suit au contraire l'activité des robots : entre octobre et décembre 2025, elle est passée de 163 à 68 IP par jour sans que l'usage réel change, simplement parce que des robots ont cessé de passer.

Une IP n'est pas exactement une personne (réseau partagé, IP mobile qui change), et le « total users » mensuel est une somme de comptes journaliers : une personne venue trois jours compte trois fois. Le jour en cours est partiel : il est signalé et exclu des moyennes.


## Code of Conduct
Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
