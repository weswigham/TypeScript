// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABlockAndNative/block-scoped-var/{_var_value;_}_const_object_=_{_value_};_export_{_value_as_renamed_}; (invocation 1).
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
{ var value; } const object = { value }; export { value as renamed };