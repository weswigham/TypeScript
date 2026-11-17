// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-sequences": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
1, 2, 3;
if (doSomething(), test) {}
if ((doSomething(), test)) {}
for (i = 0, j = 0; test; i++, j++) {}
const arrow = a => (doSomething(), a);
const allowed = a => ((doSomething(), a));
const value = (1, 2);
const nested = (1, (2, 3));