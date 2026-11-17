//// [tests/cases/conformance/lint/rules/no-unnecessary-qualifier/tsNoUnnecessaryQualifierTypedB.ts] ////

//// [input.ts]
namespace Outer {
    export type Value = number;
    const value: Outer.Value = 1;
    namespace Inner {
        type Value = string;
        const shadowed: Outer.Value = 1;
    }
}
enum Choice { First, Second = Choice.First }

//// [input.ts]
namespace Outer {
    export type Value = number;
    const value: Value = 1;
    namespace Inner {
        type Value = string;
        const shadowed: Outer.Value = 1;
    }
}
enum Choice { First, Second = First }
