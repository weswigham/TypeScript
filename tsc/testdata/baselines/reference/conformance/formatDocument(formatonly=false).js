//// [tests/cases/conformance/formatting/formatDocument.ts] ////

//// [formatDocument.ts]
export function value(input: number) {
    const result = { value: input + 1 };
    return result;
}


//// [formatDocument.js]
export function value(input) {
    const result = { value: input + 1 };
    return result;
}
