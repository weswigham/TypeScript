// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipFixes/enum_cases (invocation 2).
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
enum E { A, B } declare const value: E; switch (value) { case E.A: break;
case E.B: {
    throw new Error('Not implemented yet: E.B case');
}
 }