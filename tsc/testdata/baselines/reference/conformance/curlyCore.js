//// [tests/cases/conformance/lint/rules/curly/curlyCore.ts] ////

//// [input.ts]
if (value) work(); else other();
while (value) work();
do work(); while (value);
for (let index = 0; index < 3; index++) work();
for (const key in object) work(key);
for (const item of array) work(item);
if (value) /* Keep */ work();

//// [input.ts]
if (value) {
    work();
} else {
    other();
}
while (value) {
    work();
}
do {
    work();
} while (value);
for (let index = 0; index < 3; index++) {
    work();
}
for (const key in object) {
    work(key);
}
for (const item of array) {
    work(item);
}
if (value) /* Keep */ {
    work();
}
