// @strict: true
// @strictNullChecks: true, false
// @noEmit: true

type Filter<T, U> = T extends U ? never : T;
type Extracted<T, U> = T extends U ? T : never;

function unknownSource<U>(value: unknown & not U): Filter<unknown, U> {
    return value;
}

function anySource<T, U>(value: any): Filter<T, U> {
    return value;
}

function neverSource<T, U>(value: never): Filter<T, U> {
    return value;
}

function excludedNever<T>(value: T): Filter<T, never> {
    return value;
}

function excludedUnknown<T>(value: T): Filter<T, unknown> {
    return value;
}

function extractedUnknown<T>(value: T): Extracted<T, unknown> {
    return value;
}

function nullable<T>(value: T & not (null | undefined)): Filter<T, null | undefined> {
    return value;
}

function extractedNullish<T>(value: T & (null | undefined)): Extracted<T, null | undefined> {
    return value;
}

function nullableUnion<T>(value: T | null): Filter<T, string> {
    return value;
}

const anyFilter: Filter<any, string> = 123;
const unknownFilter: Filter<unknown, string> = 123;
const emptyFilter: Filter<never, string> = 123;
const excludedAny: Filter<string, any> = "value";
const unknownExcludedValue: Filter<string, unknown> = "value";
