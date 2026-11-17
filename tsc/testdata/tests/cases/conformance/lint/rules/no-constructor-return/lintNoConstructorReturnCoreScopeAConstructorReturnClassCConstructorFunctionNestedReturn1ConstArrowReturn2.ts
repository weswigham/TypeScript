// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAConstructorReturn/class_C_{_constructor()_{_function_nested()_{_return_1;_}_const_arrow_=_()_=>_{_return_2;_};_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-constructor-return": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class C { constructor() { function nested() { return 1; } const arrow = () => { return 2; }; } }