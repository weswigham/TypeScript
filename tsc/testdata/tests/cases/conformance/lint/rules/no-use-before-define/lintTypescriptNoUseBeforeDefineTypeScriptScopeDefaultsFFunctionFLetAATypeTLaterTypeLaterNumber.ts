// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-use-before-define/f();_function_f()_{}_let_a_=_a;_type_T_=_Later;_type_Later_=_number; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-use-before-define": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
f(); function f() {} let a = a; type T = Later; type Later = number;