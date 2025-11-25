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

get_analyse : 
	scp MEANDRE:/var/www/MEANDRE/access_log/figures/* ./access_log/figures/
	scp MEANDRE:/var/www/MEANDRE/access_log/access_log.csv ./access_log/figures/
