import { describe, it, expect } from 'vitest';
import { getLetterHeading, LETTER_MIN_CHARS, LETTER_MAX_CHARS } from './letter';

describe('getLetterHeading', () => {
  it('pet falecido retorna "Carta de despedida"', () => {
    expect(getLetterHeading('Max', true)).toBe('Carta de despedida');
  });

  it('pet vivo retorna "Uma carta para {nome}"', () => {
    expect(getLetterHeading('Max', false)).toBe('Uma carta para Max');
  });

  it('expoe os limites de caracteres', () => {
    expect(LETTER_MIN_CHARS).toBe(10);
    expect(LETTER_MAX_CHARS).toBe(4000);
  });
});
