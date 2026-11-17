// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/max-params": ["error", { "max": 2 }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
function tooMany(first: number, second: number, third: number): number {
    return first + second + third;
}
declare function tooManyDeclared(first: number, second: number, third: number): void;
const tooManyArrow = (first: number, second: number, third: number) => first + second + third;
function validPair(first: number, second: number): number { return first + second; }
function validVoidThis(this: void, first: number, second: number): number { return first + second; }
function validRest(first: number, ...rest: number[]): number { return first + rest.length; }
export {};