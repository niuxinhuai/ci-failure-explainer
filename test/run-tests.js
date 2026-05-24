import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'src', 'cli.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-failure-explainer-'));
const log = path.join(tmp, 'ci.log');
fs.writeFileSync(log, 'npm test\nFAIL test/app.test.js\nAssertionError: expected true received false\nsrc/app.js:12\n');
const out = execFileSync(process.execPath, [cli, log], { encoding: 'utf8' });
assert.match(out, /Likely cause/);
assert.match(out, /test\/app\.test\.js|src\/app\.js/);
const json = JSON.parse(execFileSync(process.execPath, [cli, log, '--json'], { encoding: 'utf8' }));
assert.equal(json.likelyCause, 'test');
console.log('ci-failure-explainer tests passed');
