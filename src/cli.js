#!/usr/bin/env node
import fs from 'node:fs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`ci-failure-explainer

Usage:
  ci-failure-explainer [log-file] [--json]

Reads CI logs and prints likely failure causes, commands, files, and next fixes.`);
  process.exit(0);
}

const json = args.includes('--json');
const file = args.find((arg) => !arg.startsWith('-'));
const input = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
const lines = input.split(/\r?\n/);

const patterns = [
  { type: 'node', match: /npm ERR!|pnpm .*ERR|yarn .*error|Cannot find module|ERR_MODULE_NOT_FOUND|TypeError:|ReferenceError:/i, fix: 'Check package installation, lockfile changes, module imports, and Node version.' },
  { type: 'test', match: /FAIL |failed|AssertionError|expected .* received|Tests?: .*failed/i, fix: 'Open the failing test first, reproduce locally, then inspect the changed code path.' },
  { type: 'lint', match: /eslint|prettier|ruff|flake8|checkstyle|ktlint/i, fix: 'Run the formatter or linter locally and fix the reported files.' },
  { type: 'build', match: /build failed|compilation failed|compile error|SyntaxError|tsc|TypeScript error/i, fix: 'Run the build command locally and inspect the first compiler error.' },
  { type: 'network', match: /ECONNRESET|ETIMEDOUT|ENOTFOUND|network timeout|connection refused/i, fix: 'Check whether this is infra flake, dependency registry access, or a service readiness issue.' },
  { type: 'permission', match: /permission denied|EACCES|not permitted/i, fix: 'Check executable bits, sandbox permissions, secrets, or CI runner permissions.' }
];

const hits = [];
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  for (const pattern of patterns) {
    if (pattern.match.test(line)) {
      hits.push({ type: pattern.type, line: i + 1, text: line.trim().slice(0, 300), fix: pattern.fix });
    }
  }
}

const commands = [...new Set(lines.filter((line) => /^\s*(npm|pnpm|yarn|pytest|python|node|go test|cargo|mvn|gradle|flutter|xcodebuild)\b/.test(line.trim())).map((line) => line.trim()))];
const files = [...new Set(input.match(/[\w./-]+\.(js|ts|tsx|jsx|py|java|kt|go|rs|swift|ets|json|yaml|yml|md):\d+/g) || [])];
const result = {
  likelyCause: hits[0]?.type || 'unknown',
  findings: hits.slice(0, 12),
  commands: commands.slice(0, 12),
  files: files.slice(0, 20),
  nextSteps: [...new Set(hits.slice(0, 5).map((hit) => hit.fix))]
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log(`# CI Failure Explanation

## Likely cause
${result.likelyCause}

## Key findings
${result.findings.length ? result.findings.map((hit) => `- Line ${hit.line} [${hit.type}]: ${hit.text}`).join('\n') : '- No obvious failure signature found. Inspect the first error above the final failure.'}

## Commands seen
${result.commands.length ? result.commands.map((cmd) => `- ${cmd}`).join('\n') : '- No common build/test command detected.'}

## Files mentioned
${result.files.length ? result.files.map((f) => `- ${f}`).join('\n') : '- No file:line references detected.'}

## Suggested next steps
${result.nextSteps.length ? result.nextSteps.map((step) => `- ${step}`).join('\n') : '- Re-run the failing job locally with verbose logging.'}
`);
