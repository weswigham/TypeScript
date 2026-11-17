//// [tests/cases/conformance/lint/rules/parameter-properties/tsParameterPropertiesCoverage.ts] ////

//// [input.ts]
class ParameterProperty {
    constructor(public value: string) {}
}

class AllowedParameterProperty {
    constructor(private readonly value: string) {}
    read(): string {
        return this.value;
    }
}

class ClassProperty {
    value: string;
    constructor(value: string) {
        this.value = value;
    }
}

//// [input.ts]
class ParameterProperty {
    constructor(public value: string) {}
}

class AllowedParameterProperty {
    constructor(private readonly value: string) {}
    read(): string {
        return this.value;
    }
}

class ClassProperty {
    value: string;
    constructor(value: string) {
        this.value = value;
    }
}
