//// [tests/cases/conformance/lint/rules/consistent-type-definitions/tsConsistentTypeDefinitionsCoverage.ts] ////

//// [input.ts]
/** Retained documentation for the converted declaration. */
type ShapeViolation = { value: number };
type GenericViolation<Value> = { readonly value: Value };
interface ValidShape { value: number; }
type ValidUnion = string | number;
type ValidFunction = (value: number) => number;
export {};

//// [input.ts]
/** Retained documentation for the converted declaration. */
interface ShapeViolation { value: number }
interface GenericViolation<Value> { readonly value: Value }
interface ValidShape { value: number; }
type ValidUnion = string | number;
type ValidFunction = (value: number) => number;
export {};
