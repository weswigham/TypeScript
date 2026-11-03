currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
export function value(){
return 1;
}

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"compilerOptions":{"incremental":true},"files":["input.ts"],"formattingOptions":{"indentSize":2}}

tsgo --formatOnly -p .
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
//// [/home/src/workspaces/project/input.ts] *modified* 
export function value() {
  return 1;
}

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"3d9ec6d66b0cbcba9a6936012cbf00a2","files":{"input.ts":"5752e44b8e3c3975b4259e940cc33773"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "3d9ec6d66b0cbcba9a6936012cbf00a2",
    "files": {
      "input.ts": "5752e44b8e3c3975b4259e940cc33773"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}



Edit [0]:: change formatting options
//// [/home/src/workspaces/project/tsconfig.json] *modified* 
{"compilerOptions":{"incremental":true},"files":["input.ts"],"formattingOptions":{"indentSize":8}}

tsgo --formatOnly -p .
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.ts] *modified* 
export function value() {
        return 1;
}

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"2853a3620f14ca14b3a143a0d6849d00","files":{"input.ts":"22f506fa354e134badf714c249dbe364"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "2853a3620f14ca14b3a143a0d6849d00",
    "files": {
      "input.ts": "22f506fa354e134badf714c249dbe364"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}



Edit [1]:: no change

tsgo --formatOnly -p .
ExitStatus:: Success
Output::

