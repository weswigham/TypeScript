// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarationsFixtures/prefer-const (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-const": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {};
let /* preserve */ value = 1;
let changed = 1;
changed++;
let { first, second } = source;
second++;
let assignedLater;
assignedLater = 1;
for (let item of values) consume(item);
for (let index = 0; index < 3; index++) consume(index);