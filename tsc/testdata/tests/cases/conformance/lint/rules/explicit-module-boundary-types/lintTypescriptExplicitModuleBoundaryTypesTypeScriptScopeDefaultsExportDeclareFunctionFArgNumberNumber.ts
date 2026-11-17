// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/explicit-module-boundary-types/export_declare_function_f(arg:_number):_number; (invocation 1).
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
export declare function f(arg: number): number;