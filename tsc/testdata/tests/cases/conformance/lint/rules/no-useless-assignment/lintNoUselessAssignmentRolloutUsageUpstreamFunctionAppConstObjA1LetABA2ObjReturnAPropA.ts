// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_App()_{_____const_obj_=_{_a:_1_};_____let_{_______a,_______b_=_(a_=_2)_____}_=_obj;_____return_<A_prop={a}_/>;____} (invocation 1).
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
				const obj = { a: 1 };
				let {
				  a,
				  b = (a = 2)
				} = obj;
				return <A prop={a} />;
			}