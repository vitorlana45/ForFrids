export const LETTER_MIN_CHARS = 10;
export const LETTER_MAX_CHARS = 4000;

/** Cabecalho adaptativo da carta: despedida (falecido) ou declaracao (vivo). */
export function getLetterHeading(petName: string, isDeceased: boolean): string {
  return isDeceased ? 'Carta de despedida' : `Uma carta para ${petName}`;
}
