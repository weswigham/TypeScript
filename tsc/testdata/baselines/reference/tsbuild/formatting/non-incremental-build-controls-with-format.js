currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
export const value=1;

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"compilerOptions":{"declaration":true},"files":["input.ts"]}

tsgo -b . --format --dry
ExitStatus:: Success
Output::
[[90mHH:MM:SS AM[0m] A non-dry build would build project '/home/src/workspaces/project/tsconfig.json'




Edit [0]:: format after dry build

tsgo -b . --format
ExitStatus:: Success
Output::
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
//// [/home/src/workspaces/project/input.d.ts] *new* 
export declare const value = 1;

//// [/home/src/workspaces/project/input.js] *new* 
export const value = 1;

//// [/home/src/workspaces/project/input.ts] *modified* 
export const value = 1;

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"250a480fd5dc659b8c8d69411c2e89e3"}},"version":"FakeTSVersion","root":["./input.ts"]}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "250a480fd5dc659b8c8d69411c2e89e3"
    }
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
  "size": 165
}

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/input.ts
Signatures::


Edit [1]:: repeat formatting

tsgo -b . --format
ExitStatus:: Success
Output::



Edit [2]:: force build without discarding formatting state

tsgo -b . --format --force
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts] *rewrite with same content*
//// [/home/src/workspaces/project/input.js] *rewrite with same content*
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *rewrite with same content*
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *rewrite with same content*

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/input.ts
Signatures::


Edit [3]:: reject formatting flags with clean
//// [/home/src/workspaces/project/input.ts] *modified* 
export const value=2;


tsgo -b . --format --clean
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[91merror[0m[90m TS6370: [0mOptions 'clean' and 'format' cannot be combined.



Edit [4]:: clean outputs and formatting state

tsgo -b . --clean
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts] *deleted*
//// [/home/src/workspaces/project/input.js] *deleted*
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *deleted*



Edit [5]:: rebuild after clean

tsgo -b . --format
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts] *new* 
export declare const value = 2;

//// [/home/src/workspaces/project/input.js] *new* 
export const value = 2;

//// [/home/src/workspaces/project/input.ts] *modified* 
export const value = 2;

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"937e573c0a16e6eea5d43862a181e573"}},"version":"FakeTSVersion","root":["./input.ts"]}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "937e573c0a16e6eea5d43862a181e573"
    }
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
  "size": 165
}

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/input.ts
Signatures::


Edit [6]:: compile after formatting

tsgo -b .
ExitStatus:: Success
Output::

