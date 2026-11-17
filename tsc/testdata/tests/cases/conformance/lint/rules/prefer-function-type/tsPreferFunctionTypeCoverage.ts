// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/prefer-function-type": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
interface Callable {
    (value: string): number;
}
type OptionalCallable = { (value: string): number } | undefined;

type FunctionType = (value: string) => number;
interface Overloaded {
    (): void;
    (value: string): void;
}
interface WithProperty {
    (value: string): number;
    label: string;
}