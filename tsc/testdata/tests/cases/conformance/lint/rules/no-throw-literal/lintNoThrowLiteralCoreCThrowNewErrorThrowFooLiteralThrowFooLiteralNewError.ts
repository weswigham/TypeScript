// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoThrowLiteral/throw_new_Error();_throw_foo_||=_'literal';_throw_foo_?_'literal'_:_new_Error(); (invocation 2).
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
throw new Error(); throw foo ||= 'literal'; throw foo ? 'literal' : new Error();