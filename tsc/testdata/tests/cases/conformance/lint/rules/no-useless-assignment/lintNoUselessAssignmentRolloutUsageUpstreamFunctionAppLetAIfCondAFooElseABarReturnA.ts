// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_App()_{_____let_A;_____if_(cond)_{_______A_=_Foo;_____}_else_{_______A_=_Bar;_____}_____return_<A_/>;____} (invocation 1).
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
				let A;
				if (cond) {
				  A = Foo;
				} else {
				  A = Bar;
				}
				return <A />;
			}