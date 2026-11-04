currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
// debugger;
export function inspect() {
    debugger;
}
debugger;

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"lint":{"rules":{"no-debugger":"error"}},"files":["input.ts"]}

tsgo --lintOnly -p .
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96minput.ts[0m:[93m3[0m:[93m5[0m - [91merror[0m[90m TS18175: [0mUnexpected 'debugger' statement.

[7m3[0m     debugger;
[7m [0m [91m    ~~~~~~~~~[0m

[96minput.ts[0m:[93m5[0m:[93m1[0m - [91merror[0m[90m TS18175: [0mUnexpected 'debugger' statement.

[7m5[0m debugger;
[7m [0m [91m~~~~~~~~~[0m


Found 2 errors in the same file, starting at: input.ts[90m:3[0m

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

