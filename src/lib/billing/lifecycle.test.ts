import { describe, expect, it } from 'vitest';
import { detectTransition } from './lifecycle';

describe('detectTransition', () => {
  it('detecta downgrade quando premium vira canceled', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: false },
      { status: 'canceled', cancelAtPeriodEnd: false },
    )).toBe('downgrade');
  });

  it('detecta downgrade quando past_due vira unpaid', () => {
    expect(detectTransition(
      { status: 'past_due', cancelAtPeriodEnd: false },
      { status: 'unpaid', cancelAtPeriodEnd: false },
    )).toBe('downgrade');
  });

  it('detecta farewell quando cancel_at_period_end liga', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: false },
      { status: 'active', cancelAtPeriodEnd: true },
    )).toBe('farewell');
  });

  it('farewell tambem sem estado anterior (primeiro upsert ja cancelando)', () => {
    expect(detectTransition(null, { status: 'active', cancelAtPeriodEnd: true })).toBe('farewell');
  });

  it('nao repete farewell se cancelAtPeriodEnd ja era true', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: true },
      { status: 'active', cancelAtPeriodEnd: true },
    )).toBeNull();
  });

  it('nao dispara nada em renovacao normal', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: false },
      { status: 'active', cancelAtPeriodEnd: false },
    )).toBeNull();
  });

  it('nao dispara downgrade sem estado anterior premium', () => {
    expect(detectTransition(null, { status: 'canceled', cancelAtPeriodEnd: false })).toBeNull();
  });

  it('past_due continua premium (sem downgrade)', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: false },
      { status: 'past_due', cancelAtPeriodEnd: false },
    )).toBeNull();
  });

  it('nao dispara nada quando o usuario desfaz o cancelamento (un-cancel)', () => {
    expect(detectTransition(
      { status: 'active', cancelAtPeriodEnd: true },
      { status: 'active', cancelAtPeriodEnd: false },
    )).toBeNull();
  });
});
