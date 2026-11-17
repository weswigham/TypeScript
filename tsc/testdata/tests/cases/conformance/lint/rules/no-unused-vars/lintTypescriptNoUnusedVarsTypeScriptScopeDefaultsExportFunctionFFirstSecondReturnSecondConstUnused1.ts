// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-unused-vars/export_function_f(first,_second)_{_return_second;_}_const_unused_=_1; (invocation 1).
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
export function f(first, second) { return second; } const unused = 1;