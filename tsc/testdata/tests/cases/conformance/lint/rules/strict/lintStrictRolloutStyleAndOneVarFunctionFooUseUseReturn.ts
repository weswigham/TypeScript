// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/strict/function_foo()_{_'use_strict';_'use_strict';_return;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "strict": [
                "error",
                "function"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
function foo() { 'use strict'; 'use strict'; return; }