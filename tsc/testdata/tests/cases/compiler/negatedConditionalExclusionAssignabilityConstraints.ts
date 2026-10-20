// @strict: true
// @noEmit: true

function constrainedCheck<T extends string>(value: string): T extends number ? never : T {
    return value;
}

function constrainedExclusion<T extends string | number>(value: T & not string): T extends string ? never : T {
    return value;
}

function constrainedExtraction<T extends string | number>(value: T & string): T extends string ? T : never {
    return value;
}

function narrowerCheck<T, V extends T>(value: V & not string): T extends string ? never : T {
    return value;
}

function onlyConstraintMatches<T extends { value: string }, U>(value: { value: string } & not U): T extends U ? never : T {
    return value;
}

function dependentBranches<T, V>(value: T & V): T extends { value: T } ? V : T {
    return value;
}

function dependentExclude<T>(
    value: T & not ((arg: T) => void),
): T extends ((arg: T) => void) ? never : T {
    return value;
}

function recursiveConstraint<T extends { next?: T }, U>(value: T & not U): T extends U ? never : T {
    return value;
}

type Filter<T, U> = T extends U ? never : T;
type WrappedFilter<T, U> = Filter<T, U>;

function instantiatedAlias<T, U>(value: T & not U): WrappedFilter<T, U> {
    return value;
}

function excludedUnion<T, U, V>(value: T & not U & not V): Filter<T, U | V> {
    return value;
}

// The negation of a generic intersection is not reduced here.
function excludedIntersection<T, U, V>(value: T & not (U & V)): Filter<T, U & V> {
    return value;
}

function incompleteExclusion<T, U, V>(value: T & not U): Filter<T, U | V> {
    return value;
}
