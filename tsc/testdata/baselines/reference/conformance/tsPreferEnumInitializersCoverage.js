//// [tests/cases/conformance/lint/rules/prefer-enum-initializers/tsPreferEnumInitializersCoverage.ts] ////

//// [input.ts]
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

//// [input.ts]
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
