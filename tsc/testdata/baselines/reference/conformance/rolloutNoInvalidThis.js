//// [tests/cases/conformance/lint/rules/no-invalid-this/rolloutNoInvalidThis.ts] ////

//// [input.ts]
export {};
this;
function plain() { return this; }
function Constructor() { this.value = 1; }
function explicit(this: object) { return this; }
const object = { method() { return this; } };
class C {
    field = this;
    static { this; }
    [this.key]() { return this; }
}

//// [input.ts]
export {};
this;
function plain() { return this; }
function Constructor() { this.value = 1; }
function explicit(this: object) { return this; }
const object = { method() { return this; } };
class C {
    field = this;
    static { this; }
    [this.key]() { return this; }
}
