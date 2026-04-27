const R = '\x1b[0m';
const C = {
  info:  '\x1b[36m',  // cyan
  warn:  '\x1b[33m',  // yellow
  error: '\x1b[31m',  // red
  debug: '\x1b[90m',  // gray
};

function ts() {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

export const log = {
  info:  (prefix: string, ...args: unknown[]) =>
    console.log(`${C.info}${ts()} INFO  ${prefix}${R}`, ...args),
  warn:  (prefix: string, ...args: unknown[]) =>
    console.warn(`${C.warn}${ts()} WARN  ${prefix}${R}`, ...args),
  error: (prefix: string, ...args: unknown[]) =>
    console.error(`${C.error}${ts()} ERROR ${prefix}${R}`, ...args),
  debug: (prefix: string, ...args: unknown[]) =>
    console.log(`${C.debug}${ts()} DEBUG ${prefix}${R}`, ...args),
};
