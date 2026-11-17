// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-unused-labels": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
unused: { work(); }
used: { break used; }
unused: /* keep */ work();
unused: ("potential directive");
work()
unused: [1].forEach(work);
work();
unused: [1].forEach(work);