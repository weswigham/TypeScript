//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamDoesnTReportXLetXYX1XYFooYDoesnTReportALetABA1ABFooB.ts] ////

//// [globals.d.ts]

//// [input.ts]

            // doesn't report _x
            let _x, y;
            _x = 1;
            [_x, y] = foo;
            y;

            // doesn't report _a
            let _a, b;
            _a = 1;
            ({_a, ...b } = foo);
            b;
            

//// [input.ts]

            // doesn't report _x
            let _x, y;
            _x = 1;
            [_x, y] = foo;
            y;

            // doesn't report _a
            let _a, b;
            _a = 1;
            ({_a, ...b } = foo);
            b;
            
