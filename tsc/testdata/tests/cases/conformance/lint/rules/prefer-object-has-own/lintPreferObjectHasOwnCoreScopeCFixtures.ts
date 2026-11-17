// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/prefer-object-has-own (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-object-has-own": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
Object.prototype.hasOwnProperty.call(object, key);
({}).hasOwnProperty.call(object, key);
(Object.hasOwnProperty.call)(object, key);
Object./* keep */prototype.hasOwnProperty.call(object, key);
function shadowed(Object: any) {
    ({}).hasOwnProperty.call(object, key);
}