#!/bin/sh
set -eu

# Set RUN_MIGRATIONS=true only for one controlled deploy. It is deliberately
# opt-in so parallel web instances never race migrations on startup.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
fi

php artisan config:cache
exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
