currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
export const value=1;

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"compilerOptions":{"declaration":true},"files":["input.ts"]}

tsgo -b . --formatOnly --formatDiagnostics --dry
ExitStatus:: Success
Output::
[[90mHH:MM:SS AM[0m] A non-dry build would build project '/home/src/workspaces/project/tsconfig.json'




Edit [0]:: format after dry build

tsgo -b . --formatOnly --formatDiagnostics
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96minput.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                  ~[0m

[96minput.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                   ~[0m


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
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {},
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 124
}



Edit [1]:: repeat formatting

tsgo -b . --formatOnly --formatDiagnostics
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96minput.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                  ~[0m

[96minput.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                   ~[0m


Found 2 errors in the same file, starting at: input.ts[90m:1[0m




Edit [2]:: force build without discarding formatting state

tsgo -b . --formatOnly --formatDiagnostics --force
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96minput.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                  ~[0m

[96minput.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                   ~[0m


Found 2 errors in the same file, starting at: input.ts[90m:1[0m




Edit [3]:: reject formatting flags with clean
//// [/home/src/workspaces/project/input.ts] *modified* 
export const value=2;


tsgo -b . --formatOnly --formatDiagnostics --clean
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[91merror[0m[90m TS6370: [0mOptions 'clean' and 'formatOnly' cannot be combined.
[91merror[0m[90m TS6370: [0mOptions 'clean' and 'formatDiagnostics' cannot be combined.



Edit [4]:: clean outputs and formatting state

tsgo -b . --clean
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *deleted*



Edit [5]:: rebuild after clean

tsgo -b . --formatOnly --formatDiagnostics
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96minput.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=2;
[7m [0m [91m                  ~[0m

[96minput.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=2;
[7m [0m [91m                   ~[0m


Found 2 errors in the same file, starting at: input.ts[90m:1[0m

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *rewrite with same content*



Edit [6]:: compile after formatting

tsgo -b .
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts] *new* 
export declare const value = 2;

//// [/home/src/workspaces/project/input.js] *new* 
export const value = 2;

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":["./input.ts"]}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {}
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./input.ts"
      ],
      "original": "./input.ts"
    }
  ],
  "size": 120
}

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
