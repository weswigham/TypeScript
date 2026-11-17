// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/explicit-module-boundary-types/export_function_f(arg_=_1):_number_{_return_arg;_} (invocation 1).
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
export function f(arg = 1): number { return arg; }