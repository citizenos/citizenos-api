# Certs

SSL certificates used **for DEV environment**. Dev has to run on SSL or there is no way of testing digital signing.

**IMPORTANT!** DO NOT USE IN PRODUCTION! For production generate your own public/private key pair and add them to environment or `./config/local.json`.

* **citizenosCARoot.pem** - Root CA certificate. Trust this and all *.dev.citizenos.com certificates are trusted.
* **dev.api.citizenos.com.key** - private key used to generate api.dev.citizenos.com certificate
* **dev.api.citizenos.com.crt** - api.dev.citizenos.com certificate
* **dev.p.citizenos.com.key** - private key used to generate dev.p.citizenos.com certificate for use with Etherpad
* **dev.p.citizenos.com.crt** - dev.p.citizenos.com certificate used for use with Etherpad
* **app_private_key.pem** - application private key used for JWT signing. Generated using ``openssl genpkey -algorithm RSA -out app_private_key.pem -pkeyopt rsa_keygen_bits:2048``. Prevent other users from reading the key ``chmod go-r app_private_key.pem``.
* **app_public_key.pem** - application public key used for JWT signing. Generated using ``openssl rsa -pubout -in app_private_key.pem -out app_public_key.pem``
