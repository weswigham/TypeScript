// @strict: true
// @noEmit: true

type ConditionalExclude<T, U> = T extends U ? never : T;
type ConditionalExtract<T, U> = T extends U ? T : never;

function conditionalExclude<T, U>(value: T & not U): ConditionalExclude<T, U> {
    return value;
}

function conditionalExcludeSubset<T, U, V>(value: T & not U & V): ConditionalExclude<T, U> {
    return value;
}

function unfiltered<T, U>(value: T): ConditionalExclude<T, U> {
    return value;
}

function unrelated<T, U>(value: not U): ConditionalExclude<T, U> {
    return value;
}

function reverse<T, U>(value: ConditionalExclude<T, U>): T & not U {
    return value;
}

function conditionalExtract<T, U>(value: T & U): ConditionalExtract<T, U> {
    return value;
}

function nonNeverTrueBranch<T, U>(value: T & not U): T extends U ? "replacement" : T {
    return value;
}

function genericTrueBranch<T, U, V>(value: T & not U): T extends U ? V : T {
    return value;
}

function trueBranchOnly<T, U>(value: "replacement"): T extends U ? "replacement" : T {
    return value;
}

function falseBranchIntersection<T, U, V>(value: T & not U & V): T extends U ? never : T & V {
    return value;
}

function falseBranchUnion<T, U, V>(value: T & not U): T extends U ? never : T | V {
    return value;
}

function bothBranches<T, U, V, W>(value: T & V & W): T extends U ? V : W {
    return value;
}

function missingFalseBranchConstraint<T, U, V>(value: T & not U): T extends U ? never : T & V {
    return value;
}

function missingTrueBranchConstraint<T, U, V>(value: T & U): T extends U ? V : T {
    return value;
}
