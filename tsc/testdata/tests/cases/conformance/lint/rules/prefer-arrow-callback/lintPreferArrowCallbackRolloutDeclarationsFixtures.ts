// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarationsFixtures/prefer-arrow-callback (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-arrow-callback": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {};
consume(function(value: number): number { return value; });
consume(function named() {});
consume(function /* preserve */ () {});
consume(function() { return this.value; }.bind(this));
consume(function recursive() { recursive(); });
consume(function() { return arguments; });
consume(function() { return this; });