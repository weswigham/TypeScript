// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoThrowLiteral/function_f(undefined)_{_throw_undefined;_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-throw-literal": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f(undefined) { throw undefined; }