// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-empty-pattern": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
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