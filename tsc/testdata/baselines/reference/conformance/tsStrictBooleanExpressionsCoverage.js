//// [tests/cases/conformance/lint/rules/strict-boolean-expressions/tsStrictBooleanExpressionsCoverage.ts] ////

//// [input.ts]
declare const nullable: boolean | null;
declare const text: string;
declare const count: number;
declare const object: object;

if (nullable) {}
if (text) {}
if (count) {}
if (object) {}

declare const enabled: boolean;
if (enabled) {}
if (nullable === true) {}
if (text.length > 0) {}
if (count !== 0) {}

//// [input.ts]
declare const nullable: boolean | null;
declare const text: string;
declare const count: number;
declare const object: object;

if (nullable) {}
if (text) {}
if (count) {}
if (object) {}

declare const enabled: boolean;
if (enabled) {}
if (nullable === true) {}
if (text.length > 0) {}
if (count !== 0) {}
