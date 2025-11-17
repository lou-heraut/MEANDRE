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


## 2. Download MEANDRE
Clone MEANDRE git
``` sh
git clone https://github.com/super-lou/MEANDRE.git
```

Copy the Makefile to your home directory to update the production server later
```sh
cp MEANDRE/Makefile ~/
```

Copy the env file from the default one and secure it
``` sh
cp MEANDRE/install.env MEANDRE/.env
```
Edit this env file with your info.\\
**WARNING : KEEP THE .ENV FILE FOR YOU. DO NOT EXPOSE IT.**

Load environment variables and move this dir in the right location
``` sh
source MEANDRE/.env
sudo mv -rv MEANDRE/ $SERVER_DIR
```


## 3. Install Apache
``` sh
sudo apt install apache2 python3-certbot-apache -y
sudo systemctl enable apache2
sudo systemctl start apache2
```


## 4. Install postgresql
#### On local computer
Save the database from MEANDRE local dir and export it to server
``` sh
source .env
sudo -u postgres pg_dump -U postgres -d $DB_NAME -Fc -b -v -f /home/louis/.postgresql/$DB_NAME.backup
scp $DB_NAME.backup $SERVER_USER@$SERVER_IP:~/
```
You need to be careful with the privileges for the postgres user.\\
With the VPN, the bandwidth is significantly limited, so if necessary, use FileSender and then wget.

#### On remotes server
Create user and database and update it with the local backup
``` sh
sudo apt install postgresql postgresql-contrib libpq-dev -y
sudo systemctl enable postgresql
sudo systemctl start postgresql
source .env
sudo -u postgres psql -U postgres -c "CREATE DATABASE \"${DB_NAME}\";"

sudo -u postgres psql -U postgres -c "CREATE ROLE \"${DB_SUPER_USER}\" WITH LOGIN PASSWORD '${DB_SUPER_PASSWORD}' SUPERUSER;"
sudo -u postgres psql -U postgres -c "CREATE USER \"${DB_USER}\" WITH PASSWORD '${DB_PASSWORD}';"

sudo -u postgres psql -U postgres -d $DB_NAME -c "GRANT CONNECT ON DATABASE \"${DB_NAME}\" TO \"${DB_USER}\";"
sudo -u postgres psql -U postgres -d $DB_NAME -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"${DB_USER}\";"
sudo -u postgres psql -U postgres -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO \"${DB_USER}\";"

sudo -u postgres pg_restore -U postgres -d $DB_NAME -v ~/$DB_NAME.backup
```


## 5. Install python
``` sh
sudo apt install python3 python3-pip -y
sudo apt install python3-flask python3-sqlalchemy python3-flask-cors python3-psycopg2 python3-numpy python3-pandas python3-dotenv python3-scipy -y
```


## 6. Configure flask app
Source info and install dependency
``` sh
sudo apt install libapache2-mod-wsgi-py3
```

Create the Apache configuration file
``` sh
source .env
sudo bash -c "cat > /etc/apache2/sites-available/MEANDRE.conf <<EOF
<VirtualHost *:80>
    ServerName $SERVER_NAME
    ServerAdmin $SERVER_EMAIL

    <IfDefine !wsgi_init>
        WSGIDaemonProcess MEANDRE processes=4 threads=5 python-path=/usr/lib/python3/dist-packages
        WSGIProcessGroup MEANDRE
        Define wsgi_init 1
    </IfDefine>

    WSGIScriptAlias / $SERVER_DIR/MEANDRE/app.wsgi

    <Directory $SERVER_DIR/MEANDRE>
        WSGIProcessGroup MEANDRE
        WSGIApplicationGroup %{GLOBAL}
        Require all granted

        #Require valid-user
        #AuthType Basic
        #AuthName "Restricted Area"
        #AuthUserFile /path/to/.htpasswd
    </Directory>

    ErrorLog /var/log/apache2/MEANDRE_error.log
    CustomLog /var/log/apache2/MEANDRE_access.log combined
</VirtualHost>
EOF"
```

Enable the new site and mod_wsgi module
``` sh
sudo a2ensite MEANDRE
sudo a2enmod wsgi
```

Restart Apache and certbot for HTTPS
``` sh
sudo systemctl restart apache2
sudo certbot --apache
```


## 7. Configure Log Statistics
Create a directory for storing log information
```sh
sudo mkdir -p /var/www/MEANDRE/access_log/hash_access_log
```

Add a cron job
```sh
sudo crontab -e
```

Then add the following line
```sh
00 7 * * * root /usr/bin/Rscript $SERVER_DIR/MEANDRE/access_log/script_hash_access_log.R >> /var/log/script_hash.log 2>&1
```


## 8. Finalize Installation
Run the Makefile
```sh
make MEANDRE
```