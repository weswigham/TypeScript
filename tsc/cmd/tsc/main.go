package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/execute"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/osutil"
)

func main() {
	os.Exit(runMain())
}

func runMain() int {
	core.ApplyDebugStackLimit()
	args := osutil.Args()[1:]
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if len(args) > 0 && args[0] == "--internal-lint-host" {
		if len(args) < 3 || !filepath.IsAbs(args[1]) || !filepath.IsAbs(args[2]) {
			fmt.Fprintln(os.Stderr, "--internal-lint-host requires absolute Node and shim paths")
			return 2
		}
		ctx = linthost.WithCommand(ctx, args[1:3])
		args = args[3:]
	}
	if len(args) > 0 {
		switch args[0] {
		case "--lsp":
			return runLSP(ctx, args[1:])
		case "--api":
			return runAPI(ctx, args[1:])
		}
	}
	result := execute.CommandLine(ctx, newSystem(), args, nil)
	return int(result.Status)
}
