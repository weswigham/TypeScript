currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
function value() {
    return 1;
}

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"compilerOptions":{"incremental":true},"files":["input.ts"],"formattingOptions":{"indentSize":2}}

tsgo --formatOnly --formatDiagnostics -p .
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96minput.ts[0m:[93m2[0m:[93m1[0m - [91merror[0m[90m TS18135: [0mExpected indentation of 2 columns.

[7m2[0m     return 1;
[7m [0m [91m~~~~[0m


Found 1 error in input.ts[90m:2[0m

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
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"3d9ec6d66b0cbcba9a6936012cbf00a2","files":{},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "3d9ec6d66b0cbcba9a6936012cbf00a2",
    "files": {},
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 124
}



Edit [0]:: no change

tsgo --formatOnly --formatDiagnostics -p .
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96minput.ts[0m:[93m2[0m:[93m1[0m - [91merror[0m[90m TS18135: [0mExpected indentation of 2 columns.

[7m2[0m     return 1;
[7m [0m [91m~~~~[0m


Found 1 error in input.ts[90m:2[0m




Edit [1]:: apply previously reported changes

tsgo --formatOnly -p .
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.ts] *modified* 
function value() {
  return 1;
}

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"3d9ec6d66b0cbcba9a6936012cbf00a2","files":{"input.ts":"836ea1494b718fec263e9d4d5d6a90bf"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "3d9ec6d66b0cbcba9a6936012cbf00a2",
    "files": {
      "input.ts": "836ea1494b718fec263e9d4d5d6a90bf"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}

