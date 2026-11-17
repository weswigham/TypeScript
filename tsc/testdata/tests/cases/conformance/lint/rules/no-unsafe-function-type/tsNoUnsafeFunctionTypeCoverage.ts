// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-unsafe-function-type":"error"}},"files":["input.ts"]}
// @filename: input.ts
export {};
let unsafe: Function;
type UnsafeAlias = Function;
let optionalUnsafe: Function | undefined;
let safe: () => void;
type Callable = (value: string) => number;
type Constructor = new () => object;
{
    type Function = () => void;
    let local: Function;
}