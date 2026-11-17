//// [tests/cases/conformance/lint/rules/no-useless-assignment/rolloutNoUselessAssignmentUsage.ts] ////

//// [input.ts]
export function select(condition: boolean) {
    let value = 0;
    if (condition) {
        value = 1;
    } else {
        value = 2;
    }
    console.log(value);
    value = 3;
    return;
}
export function loop() {
    let value = 0;
    while (true) {
        console.log(value);
        value = 1;
    }
}

//// [input.ts]
export function select(condition: boolean) {
    let value = 0;
    if (condition) {
        value = 1;
    } else {
        value = 2;
    }
    console.log(value);
    value = 3;
    return;
}
export function loop() {
    let value = 0;
    while (true) {
        console.log(value);
        value = 1;
    }
}
