// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-new": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
new Date();
(new Date());
const value = new Date();
if (value === new Date()) {}
void new Date();
new Date().getTime();