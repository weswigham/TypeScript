//// [tests/cases/conformance/lint/rules/prefer-for-of/tsPreferForOfCoverage.ts] ////

//// [input.ts]
const items = [1, 2, 3];
declare function use(value: number): void;

for (let index = 0; index < items.length; index++) {
    use(items[index]);
}

for (const item of items) {
    use(item);
}

for (let index = 0; index < items.length; index++) {
    items[index] = index;
}

//// [input.ts]
const items = [1, 2, 3];
declare function use(value: number): void;

for (let index = 0; index < items.length; index++) {
    use(items[index]);
}

for (const item of items) {
    use(item);
}

for (let index = 0; index < items.length; index++) {
    items[index] = index;
}
