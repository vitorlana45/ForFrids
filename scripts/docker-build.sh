#!/usr/bin/env sh
set -eu

IMAGE_NAME="${IMAGE_NAME:-vitorlana45/eterno-pet:latest}"
ENV_FILE="${ENV_FILE:-.env.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

read_env() {
  key="$1"
  value="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2- || true)"
  printf '%s' "$value"
}

docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$(read_env NEXT_PUBLIC_SUPABASE_URL)" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$(read_env NEXT_PUBLIC_SUPABASE_ANON_KEY)" \
  --build-arg NEXT_PUBLIC_SITE_URL="$(read_env NEXT_PUBLIC_SITE_URL)" \
  --build-arg NEXT_PUBLIC_APP_URL="$(read_env NEXT_PUBLIC_APP_URL)" \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$(read_env NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)" \
  -t "$IMAGE_NAME" .
