// @strict: true
// @noEmit: true

type Filter<T, U> = T extends U ? never : T;

function covariant<T, U>(value: () => T & not U): () => Filter<T, U> {
    return value;
}

function contravariant<T, U>(value: (arg: Filter<T, U>) => void): (arg: T & not U) => void {
    return value;
}

function covariantReverse<T, U>(value: () => Filter<T, U>): () => T & not U {
    return value;
}

function contravariantReverse<T, U>(value: (arg: T & not U) => void): (arg: Filter<T, U>) => void {
    return value;
}

function arrays<T, U>(value: (T & not U)[]): Filter<T, U>[] {
    return value;
}

function readonlyTuples<T, U>(value: readonly [T & not U]): readonly [Filter<T, U>] {
    return value;
}

function invariant<T, U>(value: { get: () => T & not U; set: (arg: T & not U) => void }): {
    get: () => Filter<T, U>;
    set: (arg: Filter<T, U>) => void;
} {
    return value;
}

function conditionalFunctionBranches<T, U, V, W>(
    value: T & ((arg: V | W) => V & W),
): T extends U ? (arg: V) => V : (arg: W) => W {
    return value;
}

function wrongFunctionBranch<T, U, V, W>(
    value: T & not U & ((arg: V) => V),
): T extends U ? (arg: V) => V : (arg: W) => W {
    return value;
}
