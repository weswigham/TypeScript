// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/param_destructure (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-param-reassign": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function task({value}, [other]) { ({key: value = 0} = source); for (other of values) {} }