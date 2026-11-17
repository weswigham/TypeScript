// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-useless-computed-key": ["error", { "enforceForClassMembers": false }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
({ ["key"]: value });
class Example { ["key"]() {} ["field"]; }