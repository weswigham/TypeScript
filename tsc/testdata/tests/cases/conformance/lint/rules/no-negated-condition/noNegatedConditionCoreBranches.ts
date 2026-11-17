// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-negated-condition": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
if (!a) {} else {}
if (a != b) {} else {}
if (a !== b) {} else {}
if (!a) {}
if (!a) {} else if (b) {} else {}
!a ? b : c;
a !== b ? c : d;
a ? b : c;