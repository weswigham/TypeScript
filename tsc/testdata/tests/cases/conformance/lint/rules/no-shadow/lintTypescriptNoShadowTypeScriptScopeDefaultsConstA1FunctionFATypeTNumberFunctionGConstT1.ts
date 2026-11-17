// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-shadow/const_a_=_1;_function_f(a)_{}_type_T_=_number;_function_g()_{_const_T_=_1;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-shadow": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const a = 1; function f(a) {} type T = number; function g() { const T = 1; }