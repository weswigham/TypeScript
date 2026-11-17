// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-useless-escape": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const identity = /\a\-/;
const edges = /[\-a\^]/;
const safe = /[\^a][a\-z][\&&]/v;
const text = "\a";
const template = `\$name`;
const raw = String.raw`\a`;