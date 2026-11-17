// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipFixes/union_cases (invocation 1).
// Migrated from TestFinalOwnershipRules/switch-exhaustiveness-check/union (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/switch-exhaustiveness-check": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const value: 'a' | 'b'; switch (value) { case 'a': break; }