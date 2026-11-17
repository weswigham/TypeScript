// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/consistent-indexed-object-style/type_Foo_=_{_[key:_string]:_A.Foo_};_interface_Bar_{_[key:_string]:_{_nested:_Bar_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-indexed-object-style": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type Foo = { [key: string]: A.Foo }; interface Bar { [key: string]: { nested: Bar } }