#!/bin/sh
# Check for unresolved Git conflicts

echo 'Check for no unresolved conflicts...'

egrep '^[><=]{7}( |$)' -r -H -I -A 4 --line-number --exclude-dir=node_modules

if [ $? -eq 0 ]; then
    echo '\nERROR! Found unmerged conflicts, please see above!';
    exit 1;
else
    echo 'OK!'
    exit 0;
fi