// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "max-lines": ["error", { "max": 2, "skipComments": true, "skipBlankLines": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
// Comment-only line.
work();

other(); /* Inline comment counts as code. */
last();