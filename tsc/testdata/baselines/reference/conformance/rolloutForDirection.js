//// [tests/cases/conformance/lint/rules/for-direction/rolloutForDirection.ts] ////

//// [input.ts]
for (let index = 0; index < 10; index--) { use(index); }
for (let index = 0; 10 > index; index -= 2) {}
var step = -2;
for (let index = 0; index <= 10; index += step) {}
for (let index = 0; index < 10; other++, index--) {}
for (let index = 0; index < 10; index++, index--) {}
for (let index = 0; index < 10; index++) {}

//// [input.ts]
for (let index = 0; index < 10; index--) { use(index); }
for (let index = 0; 10 > index; index -= 2) {}
var step = -2;
for (let index = 0; index <= 10; index += step) {}
for (let index = 0; index < 10; other++, index--) {}
for (let index = 0; index < 10; index++, index--) {}
for (let index = 0; index < 10; index++) {}
