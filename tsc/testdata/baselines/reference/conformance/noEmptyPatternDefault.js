//// [tests/cases/conformance/lint/rules/no-empty-pattern/noEmptyPatternDefault.ts] ////

//// [input.ts]
declare const source: any;
let {} = source;
let [] = source;
let { property: {} } = source;
let { property: [] } = source;
function parameter({}) {}
function defaultParameter({} = {}) {}
const arrow = ([]) => {};
({} = source);
([] = source);
({ property: {} } = source);
({ property: [] = [] } = source);
[{}] = source;
for ({} of source) {}
for ([] in source) {}
try {} catch ({}) {}
let { value = {} } = source;
let { other = [] } = source;
let [,] = source;
let [,,] = source;
const object = {};
const array = [];
function valid({ value = {} }, [other = []]) {}

//// [input.ts]
declare const source: any;
let {} = source;
let [] = source;
let { property: {} } = source;
let { property: [] } = source;
function parameter({}) {}
function defaultParameter({} = {}) {}
const arrow = ([]) => {};
({} = source);
([] = source);
({ property: {} } = source);
({ property: [] = [] } = source);
[{}] = source;
for ({} of source) {}
for ([] in source) {}
try {} catch ({}) {}
let { value = {} } = source;
let { other = [] } = source;
let [,] = source;
let [,,] = source;
const object = {};
const array = [];
function valid({ value = {} }, [other = []]) {}
