// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-invalid-this/export_{};_function_f()_{_return_this;_}_function_g(this:_object)_{_return_this;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-invalid-this": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {}; function f() { return this; } function g(this: object) { return this; }