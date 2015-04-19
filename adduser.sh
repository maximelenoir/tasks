#!/bin/bash
USERDB=data/users.db
mkdir -p $(dirname $USERDB)
touch $USERDB
read -p 'Username: ' USERNAME
cat $USERDB | cut -d, -f1 | grep -qE "^${USERNAME}$" && { echo "ERROR: User ${USERNAME} already exists"; exit 1; }
read -s -p 'Password: ' PASSWORD1
echo
read -s -p 'Password (repeat): ' PASSWORD2
echo
[ "${PASSWORD1}" = "${PASSWORD2}" ] || { echo "ERROR: Mismatching password"; exit 1; }
echo "${USERNAME},$(echo -n "${PASSWORD1}" | sha1sum | cut -d' ' -f1)" >> ${USERDB}
