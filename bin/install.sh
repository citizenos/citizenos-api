#!/bin/bash

echo -e "*** CitizeOS install ***"
echo -e "\nNOTE! CitizenOS API depends on Etherpad which is to be configured and installed separately!"
echo -e "\n\nNOTE: This script is NOT designed for production environments!"
echo
read -p "Do you want to continue install? (Y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "Install aborted!"
    [[ "$0" = "$BASH_SOURCE" ]] && exit 1 || return 1
fi
echo

echo -e "\nInstalling script dependencies"
echo " Updating apt cache..."
sudo apt-get -y update

if command -v curl 2>/dev/null; then
    echo -e "\n Curl already installed. Skipping."
    curl --version
else
    echo -e "\n Installing Curl - https://curl.haxx.se/"
    sudo apt-get -y install curl
fi

if command -v node 2>/dev/null; then
    echo -e "\n Node.js already installed. Skipping."
    node --version
else
    if command -v n 2>/dev/null; then
        echo -e "\n N already installed. Skipping."
        n --version
        node --version
    else
        echo -e "\nInstall Node.JS via Node version manager and Node.JS - https://github.com/tj/n"
        curl -L https://git.io/n-install |  bash -s -- -y
        source $HOME/.bashrc
    fi
fi

echo -e "\nInstall Postgres database - https://www.postgresql.org/docs/manuals/"
sudo apt-get -y install postgresql postgresql-contrib

echo -e "\n Create Postgres DB for CitizenOS API. User 'citizenos' with password 'citizenos'"
sudo su -c "DATABASE_URL=postgres://citizenos:citizenos@localhost:5432/citizenos npm run dbcreate" postgres
sudo su -c "psql -c \"CREATE USER citizenos WITH PASSWORD 'citizenos'\"" postgres
sudo su -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE citizenos TO citizenos\"" postgres

echo -e "\nInstall app dependencies"
npm install --no-bin-links

echo -e "\nAdding 127.0.0.1 dev.api.citizenos.com to the hosts file..."
sudo sh -c 'echo "127.0.0.1 dev.api.citizenos.com" >> /etc/hosts'

echo -e "\n\nDONE!"
