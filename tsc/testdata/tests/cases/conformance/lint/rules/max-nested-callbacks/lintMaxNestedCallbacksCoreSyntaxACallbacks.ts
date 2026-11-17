// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/callbacks (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "max-nested-callbacks": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {call(() => {});});});});});});});});});});});