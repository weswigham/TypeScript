//// [tests/cases/conformance/lint/rules/no-unused-expressions/tsNoUnusedExpressionsCoverage.ts] ////

//// [input.ts]
declare const value: number;
declare const enabled: boolean;
declare function run(): void;

value as number;
value!;
enabled && value;

run();
enabled && run();
void value;

//// [input.ts]
declare const value: number;
declare const enabled: boolean;
declare function run(): void;

value as number;
value!;
enabled && value;

run();
enabled && run();
void value;
