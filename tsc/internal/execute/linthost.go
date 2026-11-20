package execute

import (
	"context"

	"github.com/microsoft/TypeScript/tsc/internal/api"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/execute/tsc"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
)

func newLintPluginHost(ctx context.Context, sys tsc.System, options *core.CompilerOptions) lint.Host {
	if !options.RunExternalCode.IsTrue() {
		return nil
	}
	workers := 0
	if options.SingleThreaded.IsTrue() {
		workers = 1
	}
	return api.NewLintHost(ctx, sys, linthost.Options{
		CurrentDirectory: sys.GetCurrentDirectory(),
		Workers:          workers, Stderr: sys.ErrorWriter(),
		Command: linthost.CommandFromContext(ctx),
	})
}
