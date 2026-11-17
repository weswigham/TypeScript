// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABlockAndNative/block-scoped-var/var_value;_{_value_=_1;_function_nested()_{_use(value);_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "block-scoped-var": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
var value; { value = 1; function nested() { use(value); } }