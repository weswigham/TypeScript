// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/prefer-enum-initializers": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
enum Implicit {
    First,
    Second,
    Explicit = 5,
    Following,
}

enum Initialized {
    First = 0,
    Second = 1,
    Named = "Named",
}