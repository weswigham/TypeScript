// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-unused-vars/export_function_f()_{_try_{}_catch_(error)_{}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unused-vars": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export function f() { try {} catch (error) {} }