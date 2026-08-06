export const LETTER_MIN_CHARS = 10;
export const LETTER_MAX_CHARS = 4000;

/** Cabecalho adaptativo da carta: despedida (falecido) ou declaracao (vivo). */
export function getLetterHeading(petName: string, isDeceased: boolean): string {
  return isDeceased ? 'Carta de despedida' : `Uma carta para ${petName}`;
}

// Assinatura desenhada: dimensoes do "papel" e validacao do path SVG.
export const SIGNATURE_VIEW_W = 480;
export const SIGNATURE_VIEW_H = 160;
export const SIGNATURE_MAX_LEN = 50000;
export const SIGNATURE_TEXT_MAX = 60;

// A assinatura desenhada e guardada como o atributo `d` de um <path> (so comandos
// M/L/Z + numeros). Validamos no server e no render para nunca injetar nada alem disso.
export function isSafeSignaturePath(value: string): boolean {
  return value.length > 0 && value.length <= SIGNATURE_MAX_LEN && /^[MLZ0-9.,\s-]+$/.test(value);
}
