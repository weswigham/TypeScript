// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDiagnosticContracts/module-boundaries (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/explicit-module-boundary-types": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export function f(arg) { return arg; }