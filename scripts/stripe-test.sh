#!/usr/bin/env sh
# Valida o webhook Stripe localmente com Stripe CLI.
# Pré-requisito: stripe CLI instalado (https://stripe.com/docs/stripe-cli)
#
# Em um terminal:
#   ./scripts/stripe-test.sh listen
#
# Em outro terminal (com o dev server rodando):
#   ./scripts/stripe-test.sh trigger-premium
#   ./scripts/stripe-test.sh trigger-lifetime
set -eu

MODE="${1:-listen}"

case "$MODE" in
  listen)
    echo "Iniciando escuta de webhooks -> http://localhost:3000/api/stripe/webhook"
    stripe listen --forward-to http://localhost:3000/api/stripe/webhook
    ;;

  trigger-premium)
    echo "Disparando checkout.session.completed (subscription/premium)..."
    stripe trigger checkout.session.completed \
      --add checkout_session:mode=subscription \
      --add checkout_session:metadata.plan_id=premium
    ;;

  trigger-lifetime)
    echo "Disparando checkout.session.completed (payment/lifetime)..."
    stripe trigger checkout.session.completed \
      --add checkout_session:mode=payment \
      --add checkout_session:metadata.plan_id=lifetime \
      --add checkout_session:payment_status=paid
    ;;

  trigger-cancel)
    echo "Disparando customer.subscription.deleted..."
    stripe trigger customer.subscription.deleted
    ;;

  *)
    echo "Uso: $0 [listen|trigger-premium|trigger-lifetime|trigger-cancel]"
    exit 1
    ;;
esac
