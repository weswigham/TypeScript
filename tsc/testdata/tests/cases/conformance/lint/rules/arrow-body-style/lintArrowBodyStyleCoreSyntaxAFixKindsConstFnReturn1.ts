// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAFixKinds/arrow-body-style/const_fn_=_()_=>_{_return_1;_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "arrow-body-style": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const fn = () => { return 1; };