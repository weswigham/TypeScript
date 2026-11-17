//// [tests/cases/conformance/lint/rules/require-atomic-updates/rolloutRequireAtomicUpdatesUsage.ts] ////

//// [input.ts]
let shared = 0;
declare function work(): Promise<number>;
export async function update(object: { value: number }) {
    shared += await work();
    shared = (await work()) + shared;
    if (object.value) {
        object.value = await work();
    }
    let local = 0;
    local += await work();
    return local;
}

//// [input.ts]
let shared = 0;
declare function work(): Promise<number>;
export async function update(object: { value: number }) {
    shared += await work();
    shared = (await work()) + shared;
    if (object.value) {
        object.value = await work();
    }
    let local = 0;
    local += await work();
    return local;
}
