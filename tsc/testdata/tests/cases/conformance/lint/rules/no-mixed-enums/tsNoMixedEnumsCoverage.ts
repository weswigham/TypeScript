// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "target": "esnext",
        "module": "preserve"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-mixed-enums": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
enum Mixed {
    Numeric,
    Text = "text",
}
enum Merged {
    Text = "text",
}
enum Merged {
    Numeric,
}

enum NumericOnly {
    First,
    Second,
}
enum StringOnly {
    First = "first",
    Second = "second",
}