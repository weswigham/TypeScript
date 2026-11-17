//// [tests/cases/conformance/lint/rules/no-unused-vars/rolloutNoUnusedVarsUsage.ts] ////

//// [input.ts]
export const exported = 1;
let writeOnly = 0;
writeOnly = writeOnly + 1;
function recursive() {
    return recursive();
}
export function select({ omitted, ...rest }: any, unused: number) {
    return rest;
}
const typeOnlyRead = 1;
type TypeOnly = typeof typeOnlyRead;
try {
    throw new Error();
} catch (error) {}

//// [input.ts]
export const exported = 1;
let writeOnly = 0;
writeOnly = writeOnly + 1;
function recursive() {
    return recursive();
}
export function select({ omitted, ...rest }: any, unused: number) {
    return rest;
}
const typeOnlyRead = 1;
type TypeOnly = typeof typeOnlyRead;
try {
    throw new Error();
} catch (error) {}
