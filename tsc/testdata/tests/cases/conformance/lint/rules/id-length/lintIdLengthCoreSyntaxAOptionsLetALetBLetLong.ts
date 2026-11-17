// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/id-length/let_a;_let_b;_let_long; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "id-length": [
                "error",
                {
                    "exceptionPatterns": [
                        "^b$"
                    ],
                    "exceptions": [
                        "a"
                    ],
                    "max": 3,
                    "min": 2
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let a; let b; let long;