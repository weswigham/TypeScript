//// [tests/cases/conformance/lint/rules/no-restricted-exports/rolloutNoRestrictedExports.ts] ////

//// [input.ts]
export const { key: denied, ...allowed } = source;
export function privateFunction() {}
export default class Example {}
export { allowed as denied, allowed as default };
export { default } from "module";
export { value as default } from "other";
export * as default from "namespace";

//// [input.ts]
export const { key: denied, ...allowed } = source;
export function privateFunction() {}
export default class Example {}
export { allowed as denied, allowed as default };
export { default } from "module";
export { value as default } from "other";
export * as default from "namespace";
