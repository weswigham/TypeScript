// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_App()_{_____let_m;_____try_{_______m_=_2;_______unsafeFn();_______m_=_4;_____}_catch_(e)_{_______//_ignore_____}_____return_<A_prop={m}_/>;____} (invocation 1).
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
				let m;
				try {
				  m = 2;
				  unsafeFn();
				  m = 4;
				} catch (e) {
				  // ignore
				}
				return <A prop={m} />;
			}