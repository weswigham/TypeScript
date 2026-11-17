// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-restricted-properties": ["error", { "property": "bar", "allowObjects": ["allowed"] }, { "object": "limited", "allowProperties": ["good"], "message": "Use good." }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
allowed.bar;
other.bar;
const {bar} = allowed;
const {bar: value} = other;
limited.good;
limited.bad;