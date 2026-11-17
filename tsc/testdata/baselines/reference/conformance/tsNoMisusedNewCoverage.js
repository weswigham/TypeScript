//// [tests/cases/conformance/lint/rules/no-misused-new/tsNoMisusedNewCoverage.ts] ////

//// [input.ts]
interface ConstructorConfusion {
    new(): ConstructorConfusion;
    constructor(): void;
}
declare class MethodConfusion {
    new(): MethodConfusion;
}

class ImplementedMethod {
    new(): ImplementedMethod {
        return this;
    }
}
interface Instance {
    value: number;
}
interface Factory {
    new(): Instance;
}

//// [input.ts]
interface ConstructorConfusion {
    new(): ConstructorConfusion;
    constructor(): void;
}
declare class MethodConfusion {
    new(): MethodConfusion;
}

class ImplementedMethod {
    new(): ImplementedMethod {
        return this;
    }
}
interface Instance {
    value: number;
}
interface Factory {
    new(): Instance;
}
