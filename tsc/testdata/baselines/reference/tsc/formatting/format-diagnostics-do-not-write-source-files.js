currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
const value=1;


tsgo --formatOnly --formatDiagnostics input.ts
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96minput.ts[0m:[93m1[0m:[93m12[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m const value=1;
[7m [0m [91m           ~[0m

[96minput.ts[0m:[93m1[0m:[93m13[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m const value=1;
[7m [0m [91m            ~[0m


Found 2 errors in the same file, starting at: input.ts[90m:1[0m

//// [/home/src/tslibs/TS/Lib/lib.es2026.full.d.ts] *Lib*
/// <reference no-default-lib="true"/>
interface Boolean {}
interface Function {}
interface CallableFunction {}
interface NewableFunction {}
interface IArguments {}
interface Number { toExponential: any; }
interface Object {}
interface RegExp {}
interface String { charAt: any; }
interface Array<T> { length: number; [n: number]: T; }
interface ReadonlyArray<T> {}
interface SymbolConstructor {
    (desc?: string | number): symbol;
    for(name: string): symbol;
    readonly toStringTag: symbol;
}
declare var Symbol: SymbolConstructor;
interface Symbol {
    readonly [Symbol.toStringTag]: string;
}
declare const console: { log(msg: any): void; };



Edit [0]:: no change

tsgo --formatOnly --formatDiagnostics input.ts
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96minput.ts[0m:[93m1[0m:[93m12[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m const value=1;
[7m [0m [91m           ~[0m

[96minput.ts[0m:[93m1[0m:[93m13[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m const value=1;
[7m [0m [91m            ~[0m


Found 2 errors in the same file, starting at: input.ts[90m:1[0m


