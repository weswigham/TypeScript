package lint

import (
	"context"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
)

type Host interface {
	InspectPlugins(ctx context.Context, options linthost.PluginOptions) ([]string, error)
	LintBatch(ctx context.Context, program *compiler.Program, options linthost.PluginOptions, rules map[string]any, files []*ast.SourceFile) (*linthost.BatchResult, error)
	Workers() int
	Close() error
}

type SnapshotReference interface {
	ID() uint64
	Retain()
}

type ProjectBinding struct {
	Snapshot SnapshotReference
	Handle   uint64
}

type ProjectHost interface {
	LintBatchWithProject(ctx context.Context, program *compiler.Program, options linthost.PluginOptions, rules map[string]any, files []*ast.SourceFile, binding *ProjectBinding) (*linthost.BatchResult, error)
}

type (
	hostContextKey           struct{}
	projectBindingContextKey struct{}
)

func WithHost(ctx context.Context, host Host) context.Context {
	if host == nil {
		return ctx
	}
	return context.WithValue(ctx, hostContextKey{}, host)
}

func hostFromContext(ctx context.Context) Host {
	host, _ := ctx.Value(hostContextKey{}).(Host)
	return host
}

func WithProjectBinding(ctx context.Context, binding *ProjectBinding) context.Context {
	if binding == nil {
		return ctx
	}
	return context.WithValue(ctx, projectBindingContextKey{}, binding)
}

func projectBindingFromContext(ctx context.Context) *ProjectBinding {
	binding, _ := ctx.Value(projectBindingContextKey{}).(*ProjectBinding)
	return binding
}
