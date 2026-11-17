//// [tests/cases/conformance/lint/rules/no-unnecessary-type-parameters/tsNoUnnecessaryTypeParametersCoverage.ts] ////

//// [input.ts]
export {};
function consume<T>(value: T): void {}
declare function input<T>(value: T[]): void;
class Box<T> { value!: T; }
declare function readonlyOutput<T>(): readonly T[];
function identity<T>(value: T) { return value; }
function box<T>(value: T) { return { value }; }
class Many<T> { values!: T[]; }
declare function output<T>(): Promise<T>;
type Predicate = <T>(value: T) => value is T;

//// [input.ts]
export {};
function consume<T>(value: T): void {}
declare function input<T>(value: T[]): void;
class Box<T> { value!: T; }
declare function readonlyOutput<T>(): readonly T[];
function identity<T>(value: T) { return value; }
function box<T>(value: T) { return { value }; }
class Many<T> { values!: T[]; }
declare function output<T>(): Promise<T>;
type Predicate = <T>(value: T) => value is T;
