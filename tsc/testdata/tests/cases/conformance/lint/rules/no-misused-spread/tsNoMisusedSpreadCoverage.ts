// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "target": "esnext",
        "module": "preserve"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-misused-spread": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
const spreadString = [..."abc"];
const spreadArray = { ...[1, 2] };
const spreadMap = { ...new Map<string, number>() };
const spreadSet = { ...new Set<number>() };
const spreadFunction = { ...(() => 1) };
class Shape {
    value = 1;
}
const spreadInstance = { ...new Shape() };
const spreadClass = { ...Shape };
async function spreadPromise() {
    return { ...Promise.resolve(1) };
}

const copyArray = [...[1, 2]];
const copyObject = { ...{ value: 1 } };
declare const thenable: PromiseLike<number>;
const copyThenable = { ...thenable };
function assignedFunction() {}
assignedFunction.value = 1;
const copyFunctionProperties = { ...assignedFunction };