// @strict: true
// @noEmit: true

type Filter<T, U> = T extends U ? never : T;
type Extracted<T, U> = T extends U ? T : never;
type Branches<T, U, V, W> = T extends U ? V : W;

function alwaysFalseString<T>(value: { value: T }): Filter<{ value: T }, string> {
    return value;
}

function alwaysFalseNumber<T>(value: { value: T }): Filter<{ value: T }, number> {
    return value;
}

function alwaysFalseArray<T>(value: T[]): Filter<T[], string> {
    return value;
}

function alwaysFalseBranchShape<T>(
    value: { value: T; other: T },
): Branches<{ value: T }, string, never, { other: T }> {
    return value;
}

function alwaysFalseRejectsTrueBranch<T>(value: { value: T }): Extracted<{ value: T }, string> {
    return value;
}

function alwaysFalseRejectsMissingProperty<T>(
    value: { value: T },
): Branches<{ value: T }, string, { value: T }, { other: T }> {
    return value;
}

function alwaysTrueObject<T>(value: { value: T }): Extracted<{ value: T }, { value: unknown }> {
    return value;
}

function alwaysTrueArray<T>(value: T[]): Extracted<T[], readonly unknown[]> {
    return value;
}

function alwaysTrueRejectsFalseBranch<T>(value: { value: T }): Filter<{ value: T }, { value: unknown }> {
    return value;
}

function alwaysTrueRejectsMissingProperty<T>(
    value: { value: T },
): Branches<{ value: T }, { value: unknown }, { other: T }, { value: T }> {
    return value;
}

function deferredBranch<T>(value: { value: T }): Filter<{ value: T }, { value: string }> {
    return value;
}

function alwaysFalseNever<T>(value: T): Branches<T, never, { impossible: true }, T> {
    return value;
}

function alwaysFalseNeverRejectsTrueBranch<T>(
    value: T,
): Branches<T, never, T, T & { required: true }> {
    return value;
}

function alwaysTrueUnknown<T>(value: T): Branches<T, unknown, T, { impossible: true }> {
    return value;
}

function alwaysTrueUnknownRejectsFalseBranch<T>(
    value: T,
): Branches<T, unknown, T & { required: true }, T> {
    return value;
}

const falseStringValue: { value: number } = alwaysFalseString({ value: 1 });
const trueObjectValue: { value: number } = alwaysTrueObject({ value: 1 });
const unresolvedStringValue: never = deferredBranch<string>({ value: "value" });
const falseNeverValue: string = alwaysFalseNever("value");
const trueUnknownValue: string = alwaysTrueUnknown("value");
const emptyCheck: Branches<never, never, string, number> = 1;
