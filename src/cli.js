#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const VERSION = '0.1.0';
const args = process.argv.slice(2);

function has(flag) {
  return args.includes(flag);
}

function value(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
}

function usage() {
  console.log(`ci-failure-explainer v${VERSION}

Usage:
  ci-failure-explainer [log-file] [--json] [--context 2] [--max-findings 12]
  cat ci.log | ci-failure-explainer --json

Options:
  --json              Print machine-readable JSON.
  --context <n>       Include n nearby log lines around each finding. Default: 1.
  --max-findings <n>  Limit findings. Default: 12.
  --version           Print version.
  -h, --help          Show help.`);
}

if (has('--help') || has('-h')) {
  usage();
  process.exit(0);
}
if (has('--version')) {
  console.log(VERSION);
  process.exit(0);
}

const json = has('--json');
const contextSize = Number(value('--context', '1'));
const maxFindings = Number(value('--max-findings', '12'));
const file = args.find((arg, index) => !arg.startsWith('-') && args[index - 1] !== '--context' && args[index - 1] !== '--max-findings');

let input = '';
try {
  input = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
} catch (error) {
  console.error(`Unable to read log input: ${error.message}`);
  process.exit(1);
}

if (!input.trim()) {
  console.error('No CI log content provided.');
  process.exit(1);
}

const lines = input.split(/\r?\n/);
const patterns = [
  { type: 'dependency', severity: 'high', match: /npm ERR!|pnpm .*ERR|yarn .*error|Cannot find module|ERR_MODULE_NOT_FOUND|Module not found/i, fix: 'Install dependencies, check lockfile drift, and verify the package manager used in CI.' },
  { type: 'test', severity: 'high', match: /FAIL |failed|AssertionError|expected .* received|Tests?: .*failed|\bFAILED\b/i, fix: 'Reproduce the failing test locally, inspect the first assertion failure, and check recent behavior changes.' },
  { type: 'lint', severity: 'medium', match: /eslint|prettier|ruff|flake8|checkstyle|ktlint|lint failed/i, fix: 'Run the formatter or linter locally and fix the reported files.' },
  { type: 'build', severity: 'high', match: /build failed|compilation failed|compile error|SyntaxError|tsc|TypeScript error|Command failed/i, fix: 'Run the build command locally and inspect the first compiler error, not the final summary.' },
  { type: 'network', severity: 'medium', match: /ECONNRESET|ETIMEDOUT|ENOTFOUND|network timeout|connection refused|TLS handshake/i, fix: 'Check whether this is registry/network flake, service readiness, or a missing CI dependency.' },
  { type: 'permission', severity: 'medium', match: /permission denied|EACCES|not permitted|operation not permitted/i, fix: 'Check executable bits, CI runner permissions, sandbox restrictions, or missing credentials.' },
  { type: 'quota', severity: 'medium', match: /No space left|disk quota|rate limit|too many requests/i, fix: 'Inspect runner resources, cache usage, and service rate limits.' }
];

const findings = [];
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  for (const pattern of patterns) {
    if (pattern.match.test(line)) {
      const start = Math.max(0, i - contextSize);
      const end = Math.min(lines.length, i + contextSize + 1);
      findings.push({
        type: pattern.type,
        severity: pattern.severity,
        line: i + 1,
        text: line.trim().slice(0, 500),
        context: lines.slice(start, end).map((text, offset) => ({ line: start + offset + 1, text: text.slice(0, 500) })),
        fix: pattern.fix
      });
      break;
    }
  }
}

const commandPattern = /^\s*(npm|pnpm|yarn|bun|pytest|python|node|go test|cargo|mvn|gradle|flutter|dart|xcodebuild|make)\b/;
const commands = [...new Set(lines.filter((line) => commandPattern.test(line.trim())).map((line) => line.trim()))];
const files = [...new Set(input.match(/[\w./@-]+\.(js|ts|tsx|jsx|py|java|kt|go|rs|swift|ets|json|yaml|yml|md|sql):\d+(?::\d+)?/g) || [])];
const firstErrorIndex = lines.findIndex((line) => /error|failed|exception|traceback/i.test(line));
const result = {
  source: file ? path.resolve(file) : 'stdin',
  likelyCause: findings[0]?.type || 'unknown',
  firstErrorLine: firstErrorIndex >= 0 ? firstErrorIndex + 1 : null,
  findings: findings.slice(0, maxFindings),
  commands: commands.slice(0, 20),
  files: files.slice(0, 40),
  nextSteps: [...new Set(findings.slice(0, 8).map((hit) => hit.fix))]
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log(`# CI Failure Explanation

Source: ${result.source}
Likely cause: ${result.likelyCause}
${result.firstErrorLine ? `First error-like line: ${result.firstErrorLine}` : 'First error-like line: not detected'}

## Key findings
${result.findings.length ? result.findings.map((hit) => `- Line ${hit.line} [${hit.severity}/${hit.type}]: ${hit.text}`).join('\n') : '- No obvious failure signature found. Inspect the first error above the final failure.'}

## Commands seen
${result.commands.length ? result.commands.map((cmd) => `- ${cmd}`).join('\n') : '- No common build/test command detected.'}

## Files mentioned
${result.files.length ? result.files.map((f) => `- ${f}`).join('\n') : '- No file:line references detected.'}

## Suggested next steps
${result.nextSteps.length ? result.nextSteps.map((step) => `- ${step}`).join('\n') : '- Re-run the failing job locally with verbose logging and inspect the earliest error.'}
`);
