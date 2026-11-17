// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoThrowLiteral/throw_'error';_throw_undefined;_throw_foo_&&_'literal';_throw_{}; (invocation 2).
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
throw 'error'; throw undefined; throw foo && 'literal'; throw {};