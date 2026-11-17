//// [tests/cases/conformance/lint/rules/no-unsafe-negation/rolloutNoUnsafeNegation.ts] ////

//// [input.ts]
declare const value: any, object: any;
!value in object;
!value instanceof Object;
!value < object;
(!value) in object;

//// [input.ts]
declare const value: any, object: any;
!value in object;
!value instanceof Object;
!value < object;
(!value) in object;
