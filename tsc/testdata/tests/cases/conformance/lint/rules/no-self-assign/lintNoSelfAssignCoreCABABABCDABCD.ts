// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSelfAssign/[a,_...b]_=_[a,_...b];_({a:_{b},_c:_[d]}_=_{a:_{b},_c:_[d]}); (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-self-assign": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
[a, ...b] = [a, ...b]; ({a: {b}, c: [d]} = {a: {b}, c: [d]});