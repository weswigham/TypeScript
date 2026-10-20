// @strict: true
// @noEmit: true

type Extracted<T, U> = T extends U ? T : never;

function partialLiteralExtraction<T, U>(value: T & U): Extracted<T, U> {
    return value;
}

const literalNever: never = partialLiteralExtraction<string, "chosen">("chosen");

function partialObjectExtraction<T>(value: T & { kind: "chosen" }): T extends { kind: "chosen" } ? T : never {
    return value;
}

const objectNever: never = partialObjectExtraction<{ kind: string }>({ kind: "chosen" });

function partialLiteralExclusion<T>(value: T): T extends "chosen" ? T : T & not "chosen" {
    return value;
}

const excludedLiteral: string & not "chosen" = partialLiteralExclusion<string>("chosen");

function partialObjectExclusion<T>(
    value: T,
): T extends { kind: "chosen" } ? T : T & not { kind: "chosen" } {
    return value;
}

const excludedObject: { kind: string } & not { kind: "chosen" } =
    partialObjectExclusion<{ kind: string }>({ kind: "chosen" });

function disjointLiteralExclusion<T>(value: T & not "chosen"): T extends "chosen" ? never : T {
    return value;
}

function disjointObjectExclusion<T>(
    value: T & not { kind: "chosen" },
): T extends { kind: "chosen" } ? never : T {
    return value;
}

const excludedOtherLiteral: string = disjointLiteralExclusion<string>("other");
