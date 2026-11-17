//// [tests/cases/conformance/lint/rules/no-magic-numbers/tsNoMagicNumbersCoverage.ts] ////

//// [input.ts]
declare function consume(value: number): void;

enum MagicValues {
    Positive = +1,
    Negative = -2,
}
interface LiteralProperty {
    value: 1;
}
consume(7);

type AllowedLiteralTypes = 1 | -2;
const namedValue = 3;
consume(namedValue);
consume(0);

//// [input.ts]
declare function consume(value: number): void;

enum MagicValues {
    Positive = +1,
    Negative = -2,
}
interface LiteralProperty {
    value: 1;
}
consume(7);

type AllowedLiteralTypes = 1 | -2;
const namedValue = 3;
consume(namedValue);
consume(0);
