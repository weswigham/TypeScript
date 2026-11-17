//// [tests/cases/conformance/lint/rules/unified-signatures/tsUnifiedSignaturesCoverage.ts] ////

//// [input.ts]
declare function run(value: number): void;
declare function run(value: string): void;

declare class Item {
    run(): void;
    run(value: number): void;
}

interface DifferentArity {
    run(): void;
    run(value: number, other: number): void;
}

declare function named(value: number): void;
declare function named(other: string): void;

declare function unified(value: number | string): void;

//// [input.ts]
declare function run(value: number): void;
declare function run(value: string): void;

declare class Item {
    run(): void;
    run(value: number): void;
}

interface DifferentArity {
    run(): void;
    run(value: number, other: number): void;
}

declare function named(value: number): void;
declare function named(other: string): void;

declare function unified(value: number | string): void;
