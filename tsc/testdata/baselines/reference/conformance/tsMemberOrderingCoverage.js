//// [tests/cases/conformance/lint/rules/member-ordering/tsMemberOrderingCoverage.ts] ////

//// [input.ts]
class InvalidOrder {
    run(): number { return this.value; }
    value = 1;
}
interface InvalidInterface {
    run(): void;
    value: number;
}
class ValidOrder {
    value = 1;
    constructor() { this.value = 2; }
    run(): number { return this.value; }
}
interface ValidInterface {
    value: number;
    run(): void;
}
export {};

//// [input.ts]
class InvalidOrder {
    run(): number { return this.value; }
    value = 1;
}
interface InvalidInterface {
    run(): void;
    value: number;
}
class ValidOrder {
    value = 1;
    constructor() { this.value = 2; }
    run(): number { return this.value; }
}
interface ValidInterface {
    value: number;
    run(): void;
}
export {};
