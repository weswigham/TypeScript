//// [tests/cases/conformance/lint/rules/prefer-literal-enum-member/tsPreferLiteralEnumMemberCoverage.ts] ////

//// [input.ts]
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

//// [input.ts]
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
