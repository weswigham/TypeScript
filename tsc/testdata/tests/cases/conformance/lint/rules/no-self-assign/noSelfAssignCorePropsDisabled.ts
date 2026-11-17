// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-self-assign": ["error", { "props": false }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
a = a;
a.b = a.b;
this.x = this.x;
[a, b.x] = [a, b.x];