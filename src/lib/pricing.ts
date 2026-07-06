// Fonte única dos preços exibidos nas páginas (landing e /dashboard/planos).
// A cobrança real vem dos price IDs da Stripe (STRIPE_PRICE_PREMIUM_*): ao virar
// a chave NEXT_PUBLIC_LAUNCH_OFFER, troque também as envs de price no Coolify
// para os valores correspondentes — ver docs/stripe-producao.md.

interface PremiumPricing {
  monthly: {
    /** valor cobrado hoje */
    charged: string;
    /** preço cheio riscado no card; null = sem selo de oferta */
    full: string | null;
  };
  annual: {
    charged: string;
    full: string | null;
    /** charged / 12 */
    perMonth: string;
    /** 12 × mensal − anual */
    savings: string;
    /** promessa em meses, sempre arredondada PARA BAIXO da economia real */
    freeMonths: string;
  };
}

const LAUNCH_OFFER: PremiumPricing = {
  monthly: { charged: 'R$ 9,90', full: 'R$ 14,90' },
  annual: {
    charged: 'R$ 89,90',
    full: 'R$ 119,90',
    perMonth: 'R$ 7,49',
    savings: 'R$ 28,90',
    freeMonths: 'Quase 3 meses grátis',
  },
};

const REGULAR: PremiumPricing = {
  monthly: { charged: 'R$ 14,90', full: null },
  annual: {
    charged: 'R$ 119,90',
    full: null,
    perMonth: 'R$ 9,99',
    savings: 'R$ 58,90',
    freeMonths: 'Quase 4 meses grátis',
  },
};

// Opt-in explícito: sem a env (ou com qualquer valor != 'true'), vale o preço cheio.
export const launchOfferActive = process.env.NEXT_PUBLIC_LAUNCH_OFFER === 'true';

export const pricing: PremiumPricing = launchOfferActive ? LAUNCH_OFFER : REGULAR;
