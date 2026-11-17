//// [tests/cases/conformance/lint/rules/prefer-function-type/tsPreferFunctionTypeCoverage.ts] ////

//// [input.ts]
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

//// [input.ts]
type Callable = (value: string) => number;
type OptionalCallable = ((value: string) => number) | undefined;

type FunctionType = (value: string) => number;
interface Overloaded {
    (): void;
    (value: string): void;
}
interface WithProperty {
    (value: string): number;
    label: string;
}
