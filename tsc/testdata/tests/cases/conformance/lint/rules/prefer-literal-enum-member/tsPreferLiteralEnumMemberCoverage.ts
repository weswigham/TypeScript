// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/prefer-literal-enum-member": ["error", { "allowBitwiseExpressions": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
enum Computed {
    Arithmetic = 1 + 1,
    Reference = Arithmetic,
}

enum Literal {
    Negative = -42,
    Text = "text",
    Template = `template`,
}

enum Flags {
    First = 1 << 0,
    Second = 2,
    Both = First | Flags.Second,
}