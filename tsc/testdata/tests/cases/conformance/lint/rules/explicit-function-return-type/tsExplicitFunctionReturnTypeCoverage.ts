// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/explicit-function-return-type": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
function missingReturn(value: number) { return value; }
const missingArrow = (value: number) => value;
class MissingGetter {
    get value() { return 1; }
}
function validReturn(value: number): number { return value; }
const validContextual: (value: number) => number = value => value;
const validConstArrow = () => "literal" as const;
class ValidSetter {
    private stored = 0;
    constructor() {}
    set value(value: number) { this.stored = value; }
    get value(): number { return this.stored; }
}
export {};