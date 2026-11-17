//// [tests/cases/conformance/lint/rules/no-mixed-enums/tsNoMixedEnumsCoverage.ts] ////

//// [input.ts]
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

//// [input.ts]
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
