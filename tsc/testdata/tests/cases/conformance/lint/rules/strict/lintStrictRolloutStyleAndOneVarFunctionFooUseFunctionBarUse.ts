// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/strict/function_foo()_{_'use_strict';_function_bar()_{_'use_strict';_}_} (invocation 1).
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
function foo() { 'use strict'; function bar() { 'use strict'; } }