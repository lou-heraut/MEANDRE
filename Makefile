mount-postgres:
	# sudo mkdir -p /mnt/CARGO2
	sudo mount /dev/sda1 /mnt/CARGO2
	sudo systemctl restart postgresql

unmount-postgres:
	sudo systemctl stop postgresql

front:
	python3 -m http.server
back:
	. ~/python_env/bin/activate && python3 app.py

shutdown_disk:
	udisksctl power-off -b /dev/sdd 


## ACCESS STATISTICS (see access_log/stats.py)
# On the prod: the Makefile is copied to ~, hence absolute paths
MEANDRE_DIR = /var/www/MEANDRE
STATS = python3 $(MEANDRE_DIR)/access_log/stats.py
.PHONY: stats-update stats stats-live get_analyse stats-html stats-test

stats-update:
	sudo $(STATS) update
stats:
	$(STATS) ascii
stats-live:
	sudo watch -n 60 $(STATS) today

# Locally, from the repo
get_analyse:
	mkdir -p ./access_log/stats
	scp -p 'MEANDRE:$(MEANDRE_DIR)/access_log/stats/*_daily.csv' ./access_log/stats/
stats-html:
	python3 access_log/stats.py html
stats-test:
	python3 -m unittest discover -s access_log -p test_stats.py -v
