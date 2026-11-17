// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "unicode-bom": ["error", "always"] } },
    "files": ["input.ts"]
}

// @filename: input.ts
// leading comment
const value = 1;