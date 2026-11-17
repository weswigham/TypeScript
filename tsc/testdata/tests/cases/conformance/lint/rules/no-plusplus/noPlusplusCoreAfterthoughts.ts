// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
i++;
--j;
for (;; i++, (++j, k--)) {}
for (i++;;) {}
for (;--i;) {}
for (;; i = j++) {}
for (;; i++, f(--j)) {}
for (;; foo + (i++, bar)) {}