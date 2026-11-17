// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "lint": { "rules": { "no-constant-condition": ["error", { "checkLoops": "all" }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare let value: unknown;
if (typeof value) {}
if (value || true) {}
if (value && false) {}
while (true) { break; }
for (; true;) { break; }
do {} while (false);
function* suspended() { while (true) { yield value; } }
function dynamic(value: boolean) { if (value) {} }