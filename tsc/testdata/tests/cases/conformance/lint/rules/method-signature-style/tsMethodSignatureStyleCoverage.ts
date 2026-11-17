// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/method-signature-style": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
interface InvalidMethod {
    run(value: number): void;
}
type InvalidTypeMethod = {
    map<Value>(value: Value): Value;
};
interface PolymorphicThis {
    chain(): this;
}
interface ValidProperty {
    run: (value: number) => void;
    readonly read: () => number;
}
class ValidClassMethod {
    run(value: number): number { return value; }
}
export {};