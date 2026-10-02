# INSTALL MEANDRE

## 1. Prepare your server
#### Connection
Connect to you VM with below command and register with you password
``` sh
ssh user@IP
```
Create file for auto login and paste your local ssh id_rsa.pub in that file
``` sh
nano .ssh/authorized_keys
```

#### Update
Change password on new VM
``` sh
passwd
```

Update apt
``` sh
sudo apt update
sudo apt upgrade -y
```

#### Resize LVM
To see free space
``` sh
sudo vgdisplay
```

To see occupy space by partition
``` sh
sudo lvdisplay
```

Add suffisant free space to var partition
``` sh
sudo lvextend -L +200G /dev/vg1/var
sudo resize2fs /dev/vg1/var
```


## 2. Get the code
Clone MEANDRE in `/var/www/MEANDRE`, owned by your user
``` sh
sudo mkdir -p /var/www/MEANDRE
sudo chown $USER /var/www/MEANDRE
git clone https://github.com/lou-heraut/MEANDRE.git /var/www/MEANDRE
cd /var/www/MEANDRE
```
All the following commands are run from this directory: `make help` lists them.


## 3. Install the server
Install the system packages (Apache, mod_wsgi, PostgreSQL, certbot), then the Python environment of the app in `.python_env` (from `requirements.txt`)
``` sh
make deps
make venv
```

Create the `.env` file (the database password is generated) and fill in `SERVER_NAME` and `DB_NAME`
``` sh
make env
nano .env
```
**WARNING : KEEP THE .ENV FILE FOR YOU. DO NOT EXPOSE IT.**


## 4. Install the database
#### On local computer
Export the local database to `<DB_NAME>.backup`, from the MEANDRE local directory
``` sh
make db-dump
```
Copy it to the server, with `scp` or, with the limited bandwidth of the VPN, FileSender and then `wget`.

#### On remote server
Create the database and its read-only user from the dump
``` sh
make db dump=~/<DB_NAME>.backup
```


## 5. Configure Apache
Generate and enable the Apache virtual host, then enable HTTPS
``` sh
make apache
make https
```


## 6. Configure access statistics
Install the daily update of the statistics (`/etc/cron.d/meandre-stats`, at 00:30), compute them a first time from all the available logs and check the report
``` sh
make cron
make stats-update
make stats
```


## 7. Update and monitor
Deploy the last version of the code (`git pull`, Python dependencies, then the app is reloaded)
``` sh
make update
```

Check the deployed commit, Apache and the site, check the API of the map on the database, follow the errors, follow the current day of the statistics
``` sh
make status
make check
make logs
make stats-live
```
