currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
const value=1;


tsgo --format input.ts:1-2
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[91merror[0m[90m TS18131: [0mFile line ranges require '--formatOnly'.

