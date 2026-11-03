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

tsgo -b . --watch --formatOnly
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

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"e06d53e042b114b80414e49f47a0346f"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "e06d53e042b114b80414e49f47a0346f"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 176
}
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export function value() {
    return 1;
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

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"6fa02b912e65ede51ceb842f1d9f50dc"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "6fa02b912e65ede51ceb842f1d9f50dc"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 176
}
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export function value() {
    return 2;
}


Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [3]:: add an unformatted input
//// [/home/src/workspaces/project/src/added.ts] *new* 
export const added=1;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"6fa02b912e65ede51ceb842f1d9f50dc","../src/added.ts":"5470b68f545d7968d1b10a2aeab0e443"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "6fa02b912e65ede51ceb842f1d9f50dc",
      "../src/added.ts": "5470b68f545d7968d1b10a2aeab0e443"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 229
}
//// [/home/src/workspaces/project/src/added.ts] *modified* 
export const added = 1;


Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [4]:: remove an input
//// [/home/src/workspaces/project/src/added.ts] *deleted*


Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.


Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [5]:: introduce a semantic error
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value:string=1;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"6eb0b12d7522234e7fc6deec3b3e86de","../src/added.ts":"5470b68f545d7968d1b10a2aeab0e443"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "6eb0b12d7522234e7fc6deec3b3e86de",
      "../src/added.ts": "5470b68f545d7968d1b10a2aeab0e443"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 229
}
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value: string = 1;


Watch Registrations::
Directory watches::
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [6]:: fix the semantic error
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value=3;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"bb51e8c1877be486b8cee83b2eadeae5","../src/added.ts":"5470b68f545d7968d1b10a2aeab0e443"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "bb51e8c1877be486b8cee83b2eadeae5",
      "../src/added.ts": "5470b68f545d7968d1b10a2aeab0e443"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 229
}
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value = 3;


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
