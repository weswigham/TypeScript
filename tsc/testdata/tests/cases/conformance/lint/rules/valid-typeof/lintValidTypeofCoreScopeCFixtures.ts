// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/valid-typeof (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "valid-typeof": [
                "error",
                {
                    "requireStringLiterals": true
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
typeof value === "strnig";
typeof value === undefined;
typeof value === 0;
typeof value === other;
typeof value === typeof other;
typeof value === "bigint";
"number" !== typeof value;
function shadowed(undefined: string) {
    return typeof value === undefined;
}