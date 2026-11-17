//// [tests/cases/conformance/lint/rules/func-style/funcStyleCore.ts] ////

//// [input.ts]
function declaration() {}
const expression = function() {};
const arrow = () => 1;
export function named() {}
export default function() {}
function overloaded(value: number): void;
function overloaded(value: unknown) {}

//// [input.ts]
function declaration() {}
const expression = function() {};
const arrow = () => 1;
export function named() {}
export default function() {}
function overloaded(value: number): void;
function overloaded(value: unknown) {}
