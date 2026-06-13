# Running GLPI On Termux

This clone was verified on Android/Termux with PHP 8.5.1, MariaDB, and the
GLPI webroot served from `public/`.

## Installed Packages

```sh
pkg install -y php php-gd php-ldap php-sodium composer mariadb gettext nginx php-fpm tmux
```

## Dependencies

```sh
composer install --no-dev --optimize-autoloader
CYPRESS_INSTALL_BINARY=0 php bin/console dependencies install --allow-superuser
```

`CYPRESS_INSTALL_BINARY=0` is required because Cypress does not provide an
Android binary, but GLPI's frontend assets can still be built without installing
the Cypress browser package.

## Database

Start MariaDB:

```sh
cd "$PREFIX"
mariadbd-safe --datadir="$PREFIX/var/lib/mysql"
```

Create a local database and user. Use your own local password; do not commit
`config/config_db.php`.

```sh
mariadb -u root -e "CREATE DATABASE IF NOT EXISTS glpi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mariadb -u root -e "CREATE USER IF NOT EXISTS 'glpi'@'localhost' IDENTIFIED BY '<local_password>';"
mariadb -u root -e "CREATE USER IF NOT EXISTS 'glpi'@'127.0.0.1' IDENTIFIED BY '<local_password>';"
mariadb -u root -e "GRANT ALL PRIVILEGES ON glpi.* TO 'glpi'@'localhost';"
mariadb -u root -e "GRANT ALL PRIVILEGES ON glpi.* TO 'glpi'@'127.0.0.1'; FLUSH PRIVILEGES;"
```

Install the GLPI schema over TCP. Using `127.0.0.1` avoids PHP looking for a
missing Unix socket.

```sh
php bin/console database:install --no-interaction \
  --db-host=127.0.0.1 \
  --db-port=3306 \
  --db-name=glpi \
  --db-user=glpi \
  --db-password='<local_password>' \
  --default-language=en_US \
  --no-telemetry
```

## Start

```sh
tools/termux/start-glpi.sh
```

The application will be available at:

```text
http://127.0.0.1:8080/
```

Default GLPI login after a fresh install:

```text
user: glpi
password: glpi
```

Change the default password before using the app beyond local testing.

## Notes

On this Termux setup, PHP's built-in web server and PHP-FPM fail with:

```text
Cannot create lock - Permission denied
```

Starting PHP with `-d opcache.enable=0` avoids the OPcache lock failure. The
start script uses that setting for the local development server.

`php bin/console system:check_requirements` passed for required checks. Database
timezone data may show as informational until timezone tables are loaded into
MariaDB; that does not block local login or normal startup.
