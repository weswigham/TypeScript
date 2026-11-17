// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoWarningComments/no-warning-comments///_TODO:_work_/*_fixme_*/_const_string_=_'//_TODO';_const_regex_=_/[/*_TODO_*/]/; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-warning-comments": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
// TODO: work
/* fixme */
const string = '// TODO'; const regex = /[/* TODO */]/;