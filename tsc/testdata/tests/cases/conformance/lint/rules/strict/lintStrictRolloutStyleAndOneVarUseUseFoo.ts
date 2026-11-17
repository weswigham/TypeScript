// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleStrictAndOneVar/strict/'use_strict';_'use_strict';_foo(); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "strict": [
                "error",
                "global"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
'use strict'; 'use strict'; foo();