// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/radix (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "radix": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
parseInt();
parseInt("10");
Number.parseInt("10", 1);
parseInt("10", undefined);
parseInt("10", +37);
parseInt("10", 2);
Number.parseInt("10", 36);
function shadowed(parseInt: any, Number: any) {
    parseInt("10");
    Number.parseInt("10");
}