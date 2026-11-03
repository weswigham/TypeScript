currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/base.json] *new* 
{"formattingOptions":{"indentSize":2}}
//// [/home/src/workspaces/project/src/input.ts] *new* 
export function value() {
  return 1;
}

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"extends":"./base.json","compilerOptions":{"composite":true,"noEmitOnError":true,"outDir":"dist"},"include":["src"]}

tsgo -b . --watch --formatOnly --formatDiagnostics
ExitStatus:: Success
Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] Starting compilation in watch mode...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"3d9ec6d66b0cbcba9a6936012cbf00a2","files":{"../src/input.ts":"f5cd43cd8539f650ae036ac96e241d2b"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "3d9ec6d66b0cbcba9a6936012cbf00a2",
    "files": {
      "../src/input.ts": "f5cd43cd8539f650ae036ac96e241d2b"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 176
}

Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [0]:: no change


Output::

Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [1]:: change inherited formatting settings
//// [/home/src/workspaces/project/base.json] *modified* 
{"formattingOptions":{"indentSize":4}}


Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[96msrc/input.ts[0m:[93m2[0m:[93m1[0m - [91merror[0m[90m TS18135: [0mExpected indentation of 4 columns.

[7m2[0m   return 1;
[7m [0m [91m~~[0m

[[90mHH:MM:SS AM[0m] Found 1 error. Watching for file changes.

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {},
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 124
}

Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [2]:: change source text
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export function value(){
return 2;
}



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[96msrc/input.ts[0m:[93m1[0m:[93m24[0m - [91merror[0m[90m TS18148: [0mExpected a space before the function body.

[7m1[0m export function value(){
[7m [0m [91m                       ~[0m

[96msrc/input.ts[0m:[93m2[0m:[93m1[0m - [91merror[0m[90m TS18135: [0mExpected indentation of 4 columns.

[7m2[0m return 2;
[7m [0m [91m~[0m

[[90mHH:MM:SS AM[0m] Found 2 errors. Watching for file changes.


Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [3]:: add an unformatted input
//// [/home/src/workspaces/project/src/added.ts] *new* 
export const added=1;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[96msrc/added.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const added=1;
[7m [0m [91m                  ~[0m

[96msrc/added.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const added=1;
[7m [0m [91m                   ~[0m

[96msrc/input.ts[0m:[93m1[0m:[93m24[0m - [91merror[0m[90m TS18148: [0mExpected a space before the function body.

[7m1[0m export function value(){
[7m [0m [91m                       ~[0m

[96msrc/input.ts[0m:[93m2[0m:[93m1[0m - [91merror[0m[90m TS18135: [0mExpected indentation of 4 columns.

[7m2[0m return 2;
[7m [0m [91m~[0m

[[90mHH:MM:SS AM[0m] Found 4 errors. Watching for file changes.


Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [4]:: remove an input
//// [/home/src/workspaces/project/src/added.ts] *deleted*


Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[96msrc/input.ts[0m:[93m1[0m:[93m24[0m - [91merror[0m[90m TS18148: [0mExpected a space before the function body.

[7m1[0m export function value(){
[7m [0m [91m                       ~[0m

[96msrc/input.ts[0m:[93m2[0m:[93m1[0m - [91merror[0m[90m TS18135: [0mExpected indentation of 4 columns.

[7m2[0m return 2;
[7m [0m [91m~[0m

[[90mHH:MM:SS AM[0m] Found 2 errors. Watching for file changes.


Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [5]:: introduce a semantic error
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value:string=1;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[96msrc/input.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18141: [0mExpected a space after ':'.

[7m1[0m export const value:string=1;
[7m [0m [91m                   ~[0m

[96msrc/input.ts[0m:[93m1[0m:[93m26[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value:string=1;
[7m [0m [91m                         ~[0m

[96msrc/input.ts[0m:[93m1[0m:[93m27[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value:string=1;
[7m [0m [91m                          ~[0m

[[90mHH:MM:SS AM[0m] Found 3 errors. Watching for file changes.


Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [6]:: fix the semantic error
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value=3;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[96msrc/input.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=3;
[7m [0m [91m                  ~[0m

[96msrc/input.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=3;
[7m [0m [91m                   ~[0m

[[90mHH:MM:SS AM[0m] Found 2 errors. Watching for file changes.


Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [7]:: no change


Output::

Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Diff:: Watch mode does not report diagnostics again when no filesystem events were delivered.
--- nonIncremental.output.txt
+++ incremental.output.txt
@@ -1,10 +0,0 @@
-[96msrc/input.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.
-
-[7m1[0m export const value=3;
-[7m [0m [91m                  ~[0m
-
-[96msrc/input.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.
-
-[7m1[0m export const value=3;
-[7m [0m [91m                   ~[0m
-