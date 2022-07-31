#!/bin/bash
# PotatoCider 2022
# derived from https://gist.github.com/kocisov/2a9567eb51b83dfef48efce02ef3ab06

if [ -z "$1" ]; then
  echo 'Please input the server name'
fi

server_name="$1"

# install required dependencies
sudo apt update
sudo apt install -y nginx certbot python3 python3-certbot-nginx

sudo sed -i "s/server_name _;/server_name ${server_name};/g" /etc/nginx/sites-available/default

# check config and restart
sudo nginx -t
sudo systemctl restart nginx

# setup letsencrypt
sudo certbot --nginx -d "${server_name}"

# reverse proxy
cat << "EOF" | sudo sed -i '/^\tlocation \/ {$/ r /dev/stdin' /etc/nginx/sites-available/default
		proxy_pass http://localhost:3000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_set_header X-Forwarded-Host $host;
		proxy_set_header X-Forwarded-Port $server_port;

EOF
sudo sed -i 's/try_files $uri $uri\/ =404;/# try_files $uri $uri\/ =404;/' /etc/nginx/sites-available/default

# restart again
sudo nginx -t
sudo systemctl restart nginx

