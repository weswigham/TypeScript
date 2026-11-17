//// [tests/cases/conformance/lint/rules/no-duplicate-enum-values/noDuplicateEnumValues.ts] ////

//// [input.ts]
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

//// [input.ts]
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
