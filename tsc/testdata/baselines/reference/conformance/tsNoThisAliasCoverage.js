//// [tests/cases/conformance/lint/rules/no-this-alias/tsNoThisAliasCoverage.ts] ////

//// [input.ts]
export {};
class Context {
    value = 1;
    capture() {
        const alias = this;
        const { value } = this;
        const self = this;
        const property = this.value;
        return [alias, value, self, property];
    }
}

//// [input.ts]
export {};
class Context {
    value = 1;
    capture() {
        const alias = this;
        const { value } = this;
        const self = this;
        const property = this.value;
        return [alias, value, self, property];
    }
}
