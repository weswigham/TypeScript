// @lintOnly: true
// @fix: true

// @filename: base.json
{
    "lint": { "rules": { "no-debugger": "error" } }
}

// @filename: tsconfig.json
{
    "extends": "./base.json",
    "lint": { "rules": { "no-debugger": "warning" } },
    "files": ["input.ts"]
}

// @filename: input.ts
debugger;