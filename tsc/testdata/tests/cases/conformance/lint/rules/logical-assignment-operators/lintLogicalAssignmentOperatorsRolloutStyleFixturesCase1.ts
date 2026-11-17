// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleFixtures/logical-assignment-operators (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "logical-assignment-operators": [
                "error",
                "always",
                {
                    "enforceForIfStatements": true
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

let value, fallback;
value = value || fallback;
object.value = object.value ?? fallback;
object.value || (object.value = fallback);
if (value == null) {
    value = fallback;
}
if (object.deep.value) object.deep.value = fallback;
value = value || /* keep */ fallback;