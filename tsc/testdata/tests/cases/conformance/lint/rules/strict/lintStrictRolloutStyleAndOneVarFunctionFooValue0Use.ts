// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/strict/function_foo(value_=_0)_{_'use_strict';_} (invocation 1).
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
function foo(value = 0) { 'use strict'; }