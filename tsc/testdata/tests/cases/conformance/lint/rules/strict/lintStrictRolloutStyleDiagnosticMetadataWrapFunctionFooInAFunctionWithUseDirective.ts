// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleDiagnosticMetadata/strict/Wrap_function_'foo'_in_a_function_with_'use_strict'_directive. (invocation 1).
// Migrated from TestRolloutStyleStrictAndOneVar/strict/function_foo(value_=_0)_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "strict": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
function foo(value = 0) {}