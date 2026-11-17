// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "guard-for-in": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
for (const key in object) work(key);
for (const key in object) { work(key); }
for (const key in object) { if (own(key)) work(key); }
for (const key in object) { if (!own(key)) continue; work(key); }
for (const key in object) {}