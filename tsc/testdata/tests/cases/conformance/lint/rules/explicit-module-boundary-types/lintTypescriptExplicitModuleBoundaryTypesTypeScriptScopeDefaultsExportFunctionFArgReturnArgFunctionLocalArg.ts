// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/explicit-module-boundary-types/export_function_f(arg)_{_return_arg;_}_function_local(arg)_{} (invocation 1).
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
export function f(arg) { return arg; } function local(arg) {}