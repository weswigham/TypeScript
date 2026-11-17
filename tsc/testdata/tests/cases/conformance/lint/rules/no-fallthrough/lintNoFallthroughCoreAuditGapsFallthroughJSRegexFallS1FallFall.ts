// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAuditGapsFallthroughJSRegex/(fall)\s+\1/fall_fall (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-fallthrough": [
                "error",
                {
                    "commentPattern": "(fall)\\s+\\1"
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
switch (value) { case 0: work(); /* fall fall */ case 1: break; }