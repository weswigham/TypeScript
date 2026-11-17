// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictions/syntax_subjects (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-restricted-syntax": [
                "error",
                "!FunctionDeclaration CallExpression"
            ]
        }
    },
    "files": [
        "/input.tsx"
    ]
}
// @filename: /input.tsx
function f() { eval('x'); eval('y'); }