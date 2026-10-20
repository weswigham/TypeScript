// @strict: true
// @noEmit: true

function narrowedTrueBranch<T, U>(value: T & U): T extends U ? T & U : never {
    return value;
}

function extraTrueConstraint<T, U, V>(value: T & U & V): T extends U ? T & V : never {
    return value;
}

function expandedTrueBranch<T, U, V>(value: T & U): T extends U ? T | V : never {
    return value;
}

function identicalBranches<T, U>(value: T): T extends U ? T : T {
    return value;
}

function bothBranchConstraints<T, U, V, W>(value: T & V & W): T extends U ? T & V : T & W {
    return value;
}

function trueBranchRefinement<T, U>(value: T): T extends U ? T & U : T {
    return value;
}

function trueBranchSupertype<T, U>(value: T): T extends U ? U : T {
    return value;
}

function differentBranchShapes<T, U, V>(value: T & V): T extends U ? U : V {
    return value;
}

function widenedFalseBranch<T, U, V>(value: T): T extends U ? T & U : T | V {
    return value;
}

function missingBothConstraints<T, U, V, W>(value: T): T extends U ? T & V : T & W {
    return value;
}

function missingFalseConstraint<T, U, V>(value: T): T extends U ? T : T & V {
    return value;
}

function missingTrueConstraint<T, U, V>(value: T): T extends U ? T & V : T {
    return value;
}

function indexedTrueBranch<T extends { value: unknown }, U>(
    value: T & U & T["value"],
): T extends U ? T["value"] : never {
    return value;
}

// Nested distribution currently retains distinct type-parameter identities in these properties.
function narrowedObjectBranches<T, U>(value: T & { value: T & U; other: T }): T extends U ? { value: T } : { other: T } {
    return value;
}

function unrefinedObjectBranches<T, U>(value: T & { value: T; other: T }): T extends U ? { value: T } : { other: T } {
    return value;
}

function nestedFalseBranch<T, U, V>(value: T & not U & not V): T extends U ? never : T extends V ? never : T {
    return value;
}

function nestedTrueBranch<T, U, V>(value: T & U & V): T extends U ? T extends V ? T : never : never {
    return value;
}
