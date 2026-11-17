//// [tests/cases/conformance/lint/rules/restrict-template-expressions/tsRestrictTemplateExpressionsFinal.ts] ////

//// [input.ts]
export {};
declare const unknownValue: unknown;
declare const neverValue: never;
declare const branded: string & { brand: true };
`${{}}`;
`${123}`;
`${["text", 1]}`;
`${unknownValue}`;
`${neverValue}`;
`${new Error()}`;
`${branded}`;
`${["text"]}`;
function constrained<T extends string | { value: number }>(value: T) {
    return `${value}`;
}

//// [input.ts]
export {};
declare const unknownValue: unknown;
declare const neverValue: never;
declare const branded: string & { brand: true };
`${{}}`;
`${123}`;
`${["text", 1]}`;
`${unknownValue}`;
`${neverValue}`;
`${new Error()}`;
`${branded}`;
`${["text"]}`;
function constrained<T extends string | { value: number }>(value: T) {
    return `${value}`;
}
