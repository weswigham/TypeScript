// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABlockAndNative/block-scoped-var/{_var_{_key:_value_}_=_object;_}_use(value); (invocation 1).
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
{ var { key: value } = object; } use(value);