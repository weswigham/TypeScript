// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_App()_{_____________let_message_=_'unused';_____________try_{_______________const_result_=_call();_______________message_=_result.message;_____________}_catch_(e)_{_______________message_=_'used';_____________}_____________return_<A_prop={message}_/>;_____________} (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "moduleDetection": "force",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-assignment": "error"
        }
    },
    "files": [
        "/input.tsx",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.tsx
function App() {
            let message = 'unused';
            try {
              const result = call();
              message = result.message;
            } catch (e) {
              message = 'used';
            }
            return <A prop={message} />;
            }