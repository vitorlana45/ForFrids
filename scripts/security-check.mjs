import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoots = ['src'];
const ignoredDirs = new Set(['.next', 'node_modules']);

const rules = [
  {
    name: 'Direct Supabase Storage usage',
    pattern: /\.storage\./,
    allow: [
      path.normalize('src/lib/storage/client.ts'),
    ],
    message: 'Use /api/upload and src/lib/storage/client.ts instead of client-side storage calls.',
  },
  {
    name: 'Client profile updates',
    pattern: /\.from\(['"]profiles['"]\)\s*\.update\(/,
    allow: [
      path.normalize('src/lib/actions/profile.ts'),
      path.normalize('src/lib/billing/stripe-sync.ts'),
    ],
    message: 'Profile updates must go through the updateProfile server action.',
  },
  {
    name: 'Raw storage public URL generation',
    pattern: /\.getPublicUrl\(/,
    allow: [
      path.normalize('src/lib/storage/client.ts'),
    ],
    message: 'Generate public storage URLs through src/lib/storage/client.ts.',
  },
];

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!ignoredDirs.has(entry)) {
        files.push(...walk(fullPath));
      }
      continue;
    }

    if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

const findings = [];

for (const sourceRoot of sourceRoots) {
  const dir = path.join(root, sourceRoot);
  for (const file of walk(dir)) {
    const relative = path.normalize(path.relative(root, file));
    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const rule of rules) {
      if (rule.allow.includes(relative)) continue;

      lines.forEach((line, index) => {
        if (rule.pattern.test(line)) {
          findings.push({
            rule: rule.name,
            file: relative,
            line: index + 1,
            message: rule.message,
          });
        }
      });
    }
  }
}

if (findings.length > 0) {
  console.error('Security check failed:\n');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`);
  }
  process.exit(1);
}

console.log('Security check passed.');
