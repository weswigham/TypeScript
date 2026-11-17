// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/no-undefined/let_undefined;_undefined_=_0;_const_{_undefined:_renamed_}_=_source;_({_undefined_}); (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-undefined": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let undefined; undefined = 0; const { undefined: renamed } = source; ({ undefined });