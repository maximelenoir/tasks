#!/bin/bash
OUTDIR=etc
KEYNAME=server.key
CRTNAME=server.crt
mkdir -p ${OUTDIR}
openssl genrsa -des3 -out /tmp/${KEYNAME} 1024
openssl req -new -key /tmp/${KEYNAME} -out /tmp/server.csr
openssl rsa -in /tmp/${KEYNAME} -out ${OUTDIR}/${KEYNAME}
openssl x509 -req -days 365 -in /tmp/server.csr -signkey ${OUTDIR}/${KEYNAME} -out ${OUTDIR}/${CRTNAME}
