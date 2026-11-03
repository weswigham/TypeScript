currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
const value=1;


tsgo --formatOnly --watch input.ts:1-1
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[91merror[0m[90m TS18132: [0mFormatting line ranges cannot be combined with '--watch'.

