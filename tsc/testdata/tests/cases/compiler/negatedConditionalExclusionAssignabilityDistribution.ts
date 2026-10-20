// @strict: true
// @noEmit: true

function nonDistributiveArrays<T, U>(value: T & not U): T[] extends U[] ? never : T[] {
    return value;
}

function nonDistributiveTrueBranch<T>(value: [T] & [string]): [T] extends [string] ? [T] : never {
    return value;
}

const nonDistributiveNever: never = nonDistributiveTrueBranch<string | number>(["value"]);

function nonDistributiveFalseBranch<T>(value: [T]): [T] extends [string] ? [T] : [T] & not [string] {
    return value;
}

function nonDistributiveCommonBranch<T, V>(value: [T] & V): [T] extends [string] ? V : [T] {
    return value;
}

type Partition<T, U> = T extends U ? T & U : T & not U;

function partition<T, U>(value: T): Partition<T, U> {
    return value;
}

function unionSource<T, U, V>(value: (T & U) | (T & not U & V)): T extends U ? T : T & V {
    return value;
}

function missingUnionBranch<T, U, V>(value: T | V): Partition<T, U> {
    return value;
}

const stringPartition: Partition<string | number, string> = "value";
const numberPartition: Partition<string | number, string> = 1;
const outsidePartition: Partition<string | number, string> = true;
const emptyPartition: Partition<never, string> = "value";

type StringFilter<T> = T extends string ? never : T;

function wrongCheckDomain<T>(value: number & not string): StringFilter<T> {
    return value;
}
