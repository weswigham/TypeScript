currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
function value(){
const first=1;
return first+1;
}


tsgo --formatOnly --incremental --tsBuildInfoFile cache.tsbuildinfo input.ts:2-2
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
//// [/home/src/workspaces/project/cache.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/cache.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {},
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 124
}
//// [/home/src/workspaces/project/input.ts] *modified* 
function value(){
    const first = 1;
return first+1;
}




Edit [0]:: format the rest of the file

tsgo --formatOnly --incremental --tsBuildInfoFile cache.tsbuildinfo input.ts
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/cache.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"bf6daca119369487d2a4b312fe086cf7"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/cache.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "bf6daca119369487d2a4b312fe086cf7"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}
//// [/home/src/workspaces/project/input.ts] *modified* 
function value() {
    const first = 1;
    return first + 1;
}


