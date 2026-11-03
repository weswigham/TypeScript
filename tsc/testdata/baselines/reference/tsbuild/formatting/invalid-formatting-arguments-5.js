currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
const value=1;


tsgo -b --formatDiagnostics .
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[91merror[0m[90m TS5069: [0mOption 'formatDiagnostics' cannot be specified without specifying option 'format' or option 'formatOnly'.

