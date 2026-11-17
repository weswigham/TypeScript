//// [tests/cases/conformance/lint/rules/prefer-destructuring/rolloutPreferDestructuring.ts] ////

//// [input.ts]
export {};
const value = source.value;
const first = values[0];
const renamed = source.other;
const commented /* preserve */ = source.commented;
value = source.value;
const optional = source?.optional;
class Private {
    #value: number;
    method() { const value = this.#value; }
}

//// [input.ts]
export {};
const {value} = source;
const first = values[0];
const renamed = source.other;
const commented /* preserve */ = source.commented;
value = source.value;
const optional = source?.optional;
class Private {
    #value: number;
    method() { const value = this.#value; }
}
