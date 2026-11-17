// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "lib": ["esnext"] },
    "lint": { "rules": { "one-var": ["warn", { "var": "always", "let": "never", "const": "consecutive", "using": "never", "awaitUsing": "always", "separateRequires": true }] } }
}
// @filename: input.ts

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