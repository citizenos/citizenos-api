# Certificate generation

openssl req -x509 -utf8 -newkey rsa:2048 -keyout dds_good_key.pem -out dds_good_cert.crt -days 3650 -nodes

Converting to DER

openssl x509 -outform der -in dds_good_cert.crt -out dds_good_cert.der

Convert DER to HEX encoding

xxd -p dds_good_cert.der | tr -d '\n' > dds_good_cert_hex_encoded_der.crt

# Certificates

## DigiDocService (DDS)

Used for testing DDS services different responses. All certificate files with "dds_{{status}}_cert.pem" name. For testing, cert has to be uploaded to https://demo.sk.ee/upload_cert/.

Data used when generating the cert:

* Country Name (2 letter code) [AU]:EE
* State or Province Name (full name) [Some-State]:Harjumaa
* Locality Name (eg, city) []:Tallinn
* Organization Name (eg, company) [Internet Widgits Pty Ltd]:CitizenOS 
* Organizational Unit Name (eg, section) []:IT
* Common Name (e.g. server FQDN or YOUR name) []:Toomas Test
* Email Address []:info@citizenos.com

Certificate files:

* dds_good* - Positive response to the status inquiry. Status code: 5
* dds_revoked* - Certificate has been revoked (either permanently or temporarily (on hold)). Status code: 6
* dds_unknown* - Responder doesn't know about the certificate being requested. Status code: 1

Read more:

* http://id.ee/index.php?id=30303 
* https://demo.sk.ee/upload_cert/
