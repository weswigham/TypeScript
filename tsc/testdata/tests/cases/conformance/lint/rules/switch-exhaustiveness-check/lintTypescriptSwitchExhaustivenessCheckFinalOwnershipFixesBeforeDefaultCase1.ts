// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipFixes/before_default (invocation 1).
// Migrated from TestFinalOwnershipRules/switch-exhaustiveness-check/default_is_not_exhaustive (invocation 1).
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
declare const value: 'a' | 'b'; switch (value) { default: break; }