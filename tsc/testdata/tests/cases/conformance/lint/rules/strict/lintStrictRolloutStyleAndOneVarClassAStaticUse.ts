// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/strict/class_A_{_static_{_'use_strict';_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "strict": [
                "error",
                "never"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
class A { static { 'use strict'; } }