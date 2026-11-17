//// [tests/cases/conformance/lint/rules/consistent-type-assertions/tsConsistentTypeAssertionsCoverage.ts] ////

//// [input.ts]
declare const source: unknown;
const numberViolation = <number>source;
const unionViolation = <string | number>source;
const validAssertion = source as number;
const validConst = 1 as const;
const angleConstViolation = <const>"literal";
export {};

//// [input.ts]
declare const source: unknown;
const numberViolation = source as number;
const unionViolation = source as string | number;
const validAssertion = source as number;
const validConst = 1 as const;
const angleConstViolation = "literal" as const;
export {};
