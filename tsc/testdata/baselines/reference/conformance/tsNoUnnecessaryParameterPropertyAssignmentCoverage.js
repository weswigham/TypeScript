//// [tests/cases/conformance/lint/rules/no-unnecessary-parameter-property-assignment/tsNoUnnecessaryParameterPropertyAssignmentCoverage.ts] ////

//// [input.ts]
export {};
class Redundant {
    constructor(public value: number) {
        this.value = value;
    }
}
class Modified {
    constructor(public value: number) {
        value = 1;
        this.value = value;
    }
}
class Ordinary {
    value: number;
    constructor(value: number) {
        this.value = value;
    }
}

//// [input.ts]
export {};
class Redundant {
    constructor(public value: number) {
        this.value = value;
    }
}
class Modified {
    constructor(public value: number) {
        value = 1;
        this.value = value;
    }
}
class Ordinary {
    value: number;
    constructor(value: number) {
        this.value = value;
    }
}
