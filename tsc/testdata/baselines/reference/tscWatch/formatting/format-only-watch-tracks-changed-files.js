currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
export const value=1;

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"compilerOptions":{"incremental":true},"files":["input.ts"]}

tsgo --formatOnly --watch -p .
ExitStatus:: Success
Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] Starting compilation in watch mode...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

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
export const value = 1;

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"250a480fd5dc659b8c8d69411c2e89e3"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "250a480fd5dc659b8c8d69411c2e89e3"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}

Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
tsconfig.json::
SemanticDiagnostics::
*not cached* /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*not cached* /home/src/workspaces/project/input.ts
Signatures::


Edit [0]:: format a changed file
//// [/home/src/workspaces/project/input.ts] *modified* 
export const value=2;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/input.ts] *modified* 
export const value = 2;

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"937e573c0a16e6eea5d43862a181e573"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "937e573c0a16e6eea5d43862a181e573"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}

Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
tsconfig.json::
SemanticDiagnostics::
*not cached* /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*not cached* /home/src/workspaces/project/input.ts
Signatures::


Edit [1]:: no change


Output::

Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
tsconfig.json::
SemanticDiagnostics::
*not cached* /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*not cached* /home/src/workspaces/project/input.ts
Signatures::
