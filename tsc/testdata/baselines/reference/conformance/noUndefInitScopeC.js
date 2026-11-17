//// [tests/cases/conformance/lint/rules/no-undef-init/noUndefInitScopeC.ts] ////

//// [input.ts]
var retainedForHoisting = undefined;
let removable = undefined;
let annotated: string | undefined = undefined;
let commented = /* retain */ undefined;
const requiredInitializer = undefined;
function shadowed(undefined: number) {
    let value = undefined;
}
let { destructured } = undefined;

//// [input.ts]
var retainedForHoisting = undefined;
let removable;
let annotated: string | undefined;
let commented = /* retain */ undefined;
const requiredInitializer = undefined;
function shadowed(undefined: number) {
    let value = undefined;
}
let { destructured } = undefined;
