//// [tests/cases/conformance/lint/rules/no-dynamic-delete/tsNoDynamicDeleteCoverage.ts] ////

//// [input.ts]
declare const record: Record<string, unknown>;
declare const key: string;

delete record[key];
delete record[`key`];

delete record.key;
delete record["key"];
delete record[0];
delete record[-1];

//// [input.ts]
declare const record: Record<string, unknown>;
declare const key: string;

delete record[key];
delete record[`key`];

delete record.key;
delete record["key"];
delete record[0];
delete record[-1];
