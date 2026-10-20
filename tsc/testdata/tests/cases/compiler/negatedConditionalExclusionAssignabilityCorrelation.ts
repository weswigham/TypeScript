// @strict: true
// @noEmit: true

type Pair<T> = T extends { kind: "excluded" } ? never : { first: T; second: T };
type TruePair<T> = T extends { kind: string } ? { first: T; second: T } : never;
type Tuple<T> = T extends { kind: "excluded" } ? never : [T, T];
type Consumer<T> = T extends { kind: "excluded" } ? never : (value: T) => T;

function mixedPair<T>(value: T & not { kind: "excluded" } & { first: T; second: T }): Pair<T> {
    return value;
}

function mixedTruePair<T>(value: T & { first: T; second: T }): TruePair<T> {
    return value;
}

function mixedTuple<T>(value: T & not { kind: "excluded" } & [T, T]): Tuple<T> {
    return value;
}

function mixedConsumer<T>(value: T & not { kind: "excluded" } & ((value: T) => T)): Consumer<T> {
    return value;
}

type A = { kind: "a" };
type B = { kind: "b" };
const a: A = { kind: "a" };
const b: B = { kind: "b" };
const mixed: A & { first: A | B; second: A | B } = { kind: "a", first: a, second: b };
const result: { first: A; second: A } | { first: B; second: B } = mixedPair<A | B>(mixed);
const trueResult: { first: A; second: A } | { first: B; second: B } = mixedTruePair<A | B>(mixed);

type Identity<T> = T extends { kind: "excluded" } ? never : T;
function identity<T>(value: T & not { kind: "excluded" }): Identity<T> {
    return value;
}
const identityA: A | B = identity<A | B>(a);

type IndependentPair<T, U> = T extends { kind: "excluded" } ? never : { first: U; second: U };
function independentPair<T, U>(value: T & not { kind: "excluded" } & { first: U; second: U }): IndependentPair<T, U> {
    return value;
}
const independentResult: { first: A | B; second: A | B } = independentPair<A | B, A | B>(mixed);

function repeatedIndependentArgument<T>(
    value: T & not { kind: "excluded" } & { first: T; second: T },
): IndependentPair<T, T> {
    return value;
}

type ForwardedPair<T> = Pair<T>;
function forwardedPair<T>(value: T & not { kind: "excluded" } & { first: T; second: T }): ForwardedPair<T> {
    return value;
}

type PairShape<T> = { first: T; second: T };
type AliasedPair<T> = T extends { kind: "excluded" } ? never : PairShape<T>;
function aliasedPair<T>(value: T & not { kind: "excluded" } & PairShape<T>): AliasedPair<T> {
    return value;
}

function inlinePair<T>(
    value: T & not { kind: "excluded" } & { first: T; second: T },
): T extends { kind: "excluded" } ? never : { first: T; second: T } {
    return value;
}

type EqualsTest<T> = <A>() => A extends T ? 1 : 0;
type Equals<T, U> = EqualsTest<T> extends EqualsTest<U> ? true : false;
const equal: Equals<string, string> = true;
const unequal: Equals<string, number> = false;
