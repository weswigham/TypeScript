// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/prefer-rest-params (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-rest-params": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
function implicit() {
    use(arguments);
    use(arguments[0]);
    use(arguments.length);
    return () => arguments[1];
}
function explicit(arguments: unknown[]) {
    return arguments[0];
}
class Example {
    method() {
        return arguments[0];
    }
}