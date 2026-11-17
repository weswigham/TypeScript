// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "@typescript-eslint/no-duplicate-enum-values": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
enum Duplicate {
    First = 16,
    Hex = 0x10,
    String = "value",
    Template = `value`,
    Positive = +0,
    Negative = -0,
    NegativeAgain = -0,
    Coerced = +"1e2",
    Hundred = 100,
    Nested = -+1,
    NestedAgain = +-1,
}
enum Unchecked {
    First = 1,
    Implicit,
    Expression = 1 + 1,
    Reference = First,
    NotANumber = NaN,
    NotANumberAgain = NaN,
    Interpolated = `${"value"}`,
}