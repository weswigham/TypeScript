//// [tests/cases/conformance/lint/rules/no-invalid-this/tsNoInvalidThisCoverage.ts] ////

//// [input.ts]
export {};

function invalidThis() {
    return this;
}

function explicitThis(this: object) {
    return this;
}
const receiver = {
    method() {
        return this;
    },
};
class Instance {
    self = this;
    method() {
        return this;
    }
}

//// [input.ts]
export {};

function invalidThis() {
    return this;
}

function explicitThis(this: object) {
    return this;
}
const receiver = {
    method() {
        return this;
    },
};
class Instance {
    self = this;
    method() {
        return this;
    }
}
