// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/default-case/switch_(value)_{_case_1:_break;_/*_intentionally_omitted_*/_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "default-case": [
                "error",
                {
                    "commentPattern": "intentionally"
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
switch (value) { case 1: break; /* intentionally omitted */ }