// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCSuggestions/promise-function-async/class_Example_{_public'method'()_{_return_Promise.resolve(1);_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/promise-function-async": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Example { public'method'() { return Promise.resolve(1); } }