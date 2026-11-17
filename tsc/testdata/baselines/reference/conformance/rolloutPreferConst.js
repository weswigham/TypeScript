//// [tests/cases/conformance/lint/rules/prefer-const/rolloutPreferConst.ts] ////

//// [input.ts]
export {};
let /* preserve */ value = 1;
let changed = 1;
changed++;
let { first, second } = source;
second++;
let assignedLater;
assignedLater = 1;
for (let item of values) consume(item);
for (let index = 0; index < 3; index++) consume(index);

//// [input.ts]
export {};
const /* preserve */ value = 1;
let changed = 1;
changed++;
let { first, second } = source;
second++;
let assignedLater;
assignedLater = 1;
for (const item of values) consume(item);
for (let index = 0; index < 3; index++) consume(index);
