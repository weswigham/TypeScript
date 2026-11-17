//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxOptionsNameOnlyOnAliasItself.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
type Props = { nested: {} }; type MoreProps = {} | null; let Props: {}; type WrappedProps = ({});

//// [input.ts]
type Props = { nested: {} }; type MoreProps = {} | null; let Props: {}; type WrappedProps = ({});
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
