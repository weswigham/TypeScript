// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "prefer-numeric-literals": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
parseInt("11", 2);
Number.parseInt(`67`, 8);
parseInt("1F7", 16);
parseInt("1_0", 2);
parseInt("799", 8);
parseInt("", 8);
Number./* keep */parseInt("11", 2);
function shadowed(parseInt, Number) { parseInt("11", 2); Number.parseInt("67", 8); }
function* generator() { yield(Number).parseInt("11", 2); }
parseInt("11", 2)in object;