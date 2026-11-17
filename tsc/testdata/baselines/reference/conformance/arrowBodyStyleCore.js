//// [tests/cases/conformance/lint/rules/arrow-body-style/arrowBodyStyleCore.ts] ////

//// [input.ts]
const numeric = () => { return 1; };
const object = () => { return { value: 1 }; };
const commented = () => { /* Keep */ return 1; };
const sequence = () => { return (first(), second()); };
const empty = () => {};
const valid = () => 1;

//// [input.ts]
const numeric = () => (1);
const object = () => ({ value: 1 });
const commented = () => (1) /* Keep */;
const sequence = () => ((first(), second()));
const empty = () => {};
const valid = () => 1;
