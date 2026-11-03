currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
export const value=1;

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"compilerOptions":{"declaration":true,"noEmitOnError":true},"files":["input.ts"]}

tsgo --format --formatDiagnostics --watch -p .
ExitStatus:: Success
Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] Starting compilation in watch mode...

[96minput.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                  ~[0m

[96minput.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                   ~[0m


Found 2 errors in the same file, starting at: input.ts[90m:1[0m

[[90mHH:MM:SS AM[0m] Found 2 errors. Watching for file changes.

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


Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
(stored at emit) /home/src/workspaces/project/input.ts


Edit [0]:: emit changed source despite formatting diagnostics
//// [/home/src/workspaces/project/input.ts] *modified* 
export const value=2;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[96minput.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=2;
[7m [0m [91m                  ~[0m

[96minput.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=2;
[7m [0m [91m                   ~[0m


Found 2 errors in the same file, starting at: input.ts[90m:1[0m

[[90mHH:MM:SS AM[0m] Found 2 errors. Watching for file changes.

//// [/home/src/workspaces/project/input.d.ts] *modified* 
export declare const value = 2;

//// [/home/src/workspaces/project/input.js] *modified* 
export const value = 2;


Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/input.ts
