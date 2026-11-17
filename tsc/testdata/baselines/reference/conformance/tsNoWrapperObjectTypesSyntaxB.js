//// [tests/cases/conformance/lint/rules/no-wrapper-object-types/tsNoWrapperObjectTypesSyntaxB.ts] ////

//// [input.ts]
let wrapped: Number;
let primitive: number;
interface Wrapped extends String {}
const conversion = Number(1);

//// [input.ts]
let wrapped: number;
let primitive: number;
interface Wrapped extends String {}
const conversion = Number(1);
