//// [tests/cases/conformance/lint/rules/prefer-as-const/tsPreferAsConstCoverage.ts] ////

//// [input.ts]
const asserted = "a" as "a";
const angleAsserted = <1>1;
let annotated: 1 = 1;

const constant = "a" as const;
const differentRawLiteral = 0x10 as 16;
const widened = "a" as string;

//// [input.ts]
const asserted = "a" as const;
const angleAsserted = <const>1;
let annotated: 1 = 1;

const constant = "a" as const;
const differentRawLiteral = 0x10 as 16;
const widened = "a" as string;
