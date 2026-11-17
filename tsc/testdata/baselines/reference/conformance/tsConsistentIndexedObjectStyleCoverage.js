//// [tests/cases/conformance/lint/rules/consistent-indexed-object-style/tsConsistentIndexedObjectStyleCoverage.ts] ////

//// [input.ts]
type StringIndexViolation = { [name: string]: number };
interface NumberIndexViolation { [index: number]: string; }
type ValidRecord = Record<string, number>;
type RecursiveValid = { [name: string]: RecursiveValid };
type DependentValid<Shape> = { [Name in keyof Shape]: Shape[Name] };
interface NamedValid { name: string; }
export {};

//// [input.ts]
type StringIndexViolation = Record<string, number>;
type NumberIndexViolation = Record<number, string>;
type ValidRecord = Record<string, number>;
type RecursiveValid = { [name: string]: RecursiveValid };
type DependentValid<Shape> = { [Name in keyof Shape]: Shape[Name] };
interface NamedValid { name: string; }
export {};
