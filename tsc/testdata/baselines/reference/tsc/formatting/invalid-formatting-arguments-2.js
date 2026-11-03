currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
const value=1;


tsgo --formatOnly input.ts:0-2
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[91merror[0m[90m TS18129: [0mInvalid formatting line range '0-2'. Expected positive, inclusive line ranges such as '120-500,1001-2100'.

