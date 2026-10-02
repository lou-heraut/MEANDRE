# MEANDRE : toutes les commandes du projet, lancées depuis le dossier du
# code, en local comme sur le serveur. `make help` liste les cibles.

APP = MEANDRE
PYTHON ?= python3
# Alias ssh du serveur (~/.ssh/config) et dossier du code sur le serveur
SERVER = MEANDRE
SERVER_DIR = /var/www/MEANDRE
PACKAGES = apache2 libapache2-mod-wsgi-py3 python3-certbot-apache \
	postgresql postgresql-contrib libpq-dev python3 python3-pip \
	python3-flask python3-sqlalchemy python3-flask-cors python3-psycopg2 \
	python3-numpy python3-pandas python3-dotenv python3-scipy

WSGI_INIT = wsgi_init_$(shell echo $(APP) | tr 'A-Z-' 'a-z_')
CHECK_ENV = test -f .env || { echo "pas de .env : make env"; exit 1; }
# Value of a .env key (KEY=value, quotes optional): .env is read, never run
dotenv = $$(sed -n 's/^$(1)=//p' .env | sed "s/^[\"']\(.*\)[\"']$$/\1/")
define STATUS
$(CHECK_ENV)
server=$(call dotenv,SERVER_NAME)
git log -1 --format="commit  %h %s (%cr)"
echo "apache  $$(systemctl is-active apache2)"
echo "site    $$(curl -s -o /dev/null -w '%{http_code}' https://$$server/)"
endef

.ONESHELL:
.SHELLFLAGS = -ec
.PHONY: help run test db-dump deps env db apache https cron \
	update status logs stats-update stats stats-live stats-get stats-html

help:  ## liste des cibles
	@awk -F':.*## ' '/^## /{print "\n" substr($$0, 4)} /^[a-z-]+:.*## /{printf "  make %-13s %s\n", $$1, $$2}' $(MAKEFILE_LIST)


## Développement (local)
run:  ## lance l'appli sur http://127.0.0.1:5000
	$(PYTHON) app.py

test:  ## teste les statistiques sur des logs synthétiques
	$(PYTHON) -m unittest discover -s access_log -p test_stats.py -v

db-dump:  ## exporte la base locale dans <DB_NAME>.backup, à copier sur le serveur
	@$(CHECK_ENV)
	db=$(call dotenv,DB_NAME)
	sudo -u postgres pg_dump -Fc -d "$$db" > "$$db.backup"
	echo "$$db.backup créé"


## Installation du serveur (une fois, dans le dossier cloné)
deps:  ## installe les paquets (Apache, mod_wsgi, Python, PostgreSQL, certbot)
	sudo apt update
	sudo apt install -y $(PACKAGES)
	sudo a2enmod -q wsgi

env:  ## crée .env depuis .env.example, mot de passe de la base généré
	@test ! -f .env || { echo ".env existe déjà"; exit 0; }
	cp .env.example .env
	sed -i "s/changez-moi/$$(openssl rand -hex 16)/" .env
	chmod 640 .env
	sudo chgrp www-data .env
	echo ".env créé : renseigner SERVER_NAME et DB_NAME"

db:  ## crée la base et son utilisateur en lecture seule : make db dump=FICHIER
	@test -n "$(dump)" || { echo "usage : make db dump=FICHIER"; exit 1; }
	$(CHECK_ENV)
	db=$(call dotenv,DB_NAME); user=$(call dotenv,DB_USER); password=$(call dotenv,DB_PASSWORD)
	sudo -u postgres createdb "$$db"
	sudo -u postgres pg_restore --no-owner -d "$$db" < "$(dump)"
	sudo -u postgres psql -d "$$db" -c "CREATE USER \"$$user\" WITH PASSWORD '$$password'; \
		GRANT CONNECT ON DATABASE \"$$db\" TO \"$$user\"; \
		GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"$$user\";"

apache:  ## génère et active le vhost Apache (SERVER_NAME lu dans .env)
	@$(CHECK_ENV)
	server=$(call dotenv,SERVER_NAME)
	conf=/etc/apache2/sites-available/$(APP).conf
	test ! -f $$conf || { echo "$$conf existe déjà, rien n'est modifié"; exit 1; }
	printf '%s\n' \
		"<VirtualHost *:80>" \
		"    ServerName $$server" \
		"" \
		"    <IfDefine !$(WSGI_INIT)>" \
		"        WSGIDaemonProcess $(APP) processes=4 threads=5 python-path=/usr/lib/python3/dist-packages" \
		"        WSGIProcessGroup $(APP)" \
		"        Define $(WSGI_INIT) 1" \
		"    </IfDefine>" \
		"" \
		"    WSGIScriptAlias / $(CURDIR)/app.wsgi" \
		"" \
		"    <Directory $(CURDIR)>" \
		"        WSGIProcessGroup $(APP)" \
		"        WSGIApplicationGroup %{GLOBAL}" \
		"        Require all granted" \
		"    </Directory>" \
		"" \
		"    ErrorLog /var/log/apache2/$(APP)_error.log" \
		"    CustomLog /var/log/apache2/$(APP)_access.log combined" \
		"</VirtualHost>" \
		| sudo tee $$conf > /dev/null
	sudo a2ensite -q $(APP)
	sudo apachectl configtest
	sudo systemctl reload apache2
	echo "vhost actif : http://$$server/ (HTTPS : make https)"

https:  ## active HTTPS avec certbot pour SERVER_NAME
	@$(CHECK_ENV)
	sudo certbot --apache -d "$(call dotenv,SERVER_NAME)"

cron:  ## installe la mise à jour quotidienne des statistiques (00h30)
	echo "30 0 * * * root /usr/bin/python3 $(CURDIR)/access_log/stats.py update >> /var/log/$(APP)_stats.log 2>&1" \
		| sudo tee /etc/cron.d/meandre-stats


## Exploitation (serveur)
update:  ## met à jour le code (git pull) et recharge l'appli
	git pull --ff-only --no-rebase
	touch app.wsgi
	$(STATUS)

status:  ## commit déployé, état d'Apache et code HTTP du site
	@$(STATUS)

logs:  ## suit le log d'erreur Apache de l'appli
	sudo tail -f /var/log/apache2/$(APP)_error.log


## Statistiques d'accès de MEANDRE et MEANDRE-TRACC
stats-update:  ## recalcule les statistiques depuis les logs (serveur, sudo)
	sudo $(PYTHON) access_log/stats.py update

stats:  ## rapport des statistiques dans le terminal
	$(PYTHON) access_log/stats.py ascii

stats-live:  ## chiffres du jour en cours, rafraîchis chaque minute (serveur, sudo)
	sudo watch -n 60 $(PYTHON) access_log/stats.py today

stats-get:  ## rapatrie les CSV du serveur (local)
	mkdir -p access_log/stats
	scp -p '$(SERVER):$(SERVER_DIR)/access_log/stats/*_daily.csv' access_log/stats/

stats-html:  ## génère access_log/stats/report.html (local, plotly)
	$(PYTHON) access_log/stats.py html
