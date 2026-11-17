// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/max-nested-callbacks/new_Example(()_=>_{_new_Example(()_=>_1);_}); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "max-nested-callbacks": [
                "error",
                {
                    "checkConstructorCallCallbacks": true,
                    "max": 1
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new Example(() => { new Example(() => 1); });