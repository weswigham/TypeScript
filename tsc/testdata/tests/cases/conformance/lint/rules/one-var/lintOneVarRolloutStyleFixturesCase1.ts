// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleFixtures/one-var (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "lib": [
            "esnext"
        ],
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "one-var": [
                "error",
                {
                    "awaitUsing": "always",
                    "const": "consecutive",
                    "let": "never",
                    "separateRequires": true,
                    "using": "never",
                    "var": "always"
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

declare function acquire(): Disposable & AsyncDisposable;

async function example() {
    var first;
    var second;
    let third = 1, fourth = 2;
    const fifth = 5;
    const sixth = 6;
    using seventh = acquire(), eighth = acquire();
    await using ninth = acquire();
    await using tenth = acquire();
}