// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipRules/switch-exhaustiveness-check/unnecessary_default (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/switch-exhaustiveness-check": [
                "error",
                {
                    "allowDefaultCaseForExhaustiveSwitch": false
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const value: boolean; switch (value) { case true: case false: default: break; }