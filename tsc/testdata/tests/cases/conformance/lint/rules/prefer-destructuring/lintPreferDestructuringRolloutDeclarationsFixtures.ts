// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarationsFixtures/prefer-destructuring (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-destructuring": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {};
const value = source.value;
const first = values[0];
const renamed = source.other;
const commented /* preserve */ = source.commented;
value = source.value;
const optional = source?.optional;
class Private {
    #value: number;
    method() { const value = this.#value; }
}