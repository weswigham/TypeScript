// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "default-case": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
switch (value) { case 1: break; }
switch (value) { case 1: break; /* no default */ }
switch (value) { case 1: break; default: break; }
switch (value) {}