// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "default-case-last": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
switch (value) { default: break; case 1: break; }
switch (value) { case 1: break; default: break; }