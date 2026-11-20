package lint

import (
	"context"
	"sync"
	"weak"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

// Cache shares completed lint results between editor requests for the same program.
// Program keys are weak so retaining the cache does not retain obsolete snapshots.
type Cache struct {
	mu       sync.Mutex
	programs map[weak.Pointer[compiler.Program]]map[*ast.SourceFile]*cachedDiagnostics
}

type cachedDiagnostics struct {
	done        chan struct{}
	diagnostics []*ast.Diagnostic
}

func GetDiagnosticsForFiles(ctx context.Context, program *compiler.Program, files []*ast.SourceFile) []*ast.Diagnostic {
	return getDiagnostics(ctx, program, files)
}

func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.programs = nil
}

func (c *Cache) GetDiagnostics(ctx context.Context, program *compiler.Program, files []*ast.SourceFile) []*ast.Diagnostic {
	key := weak.Make(program)
	for ctx.Err() == nil {
		c.mu.Lock()
		if c.programs == nil {
			c.programs = make(map[weak.Pointer[compiler.Program]]map[*ast.SourceFile]*cachedDiagnostics)
		}
		for key := range c.programs {
			if key.Value() == nil {
				delete(c.programs, key)
			}
		}
		entries := c.programs[key]
		if entries == nil {
			entries = make(map[*ast.SourceFile]*cachedDiagnostics)
			c.programs[key] = entries
		}
		var waiting *cachedDiagnostics
		for _, file := range files {
			if entry := entries[file]; entry != nil {
				select {
				case <-entry.done:
					continue
				default:
					waiting = entry
				}
			}
		}
		if waiting != nil {
			c.mu.Unlock()
			select {
			case <-ctx.Done():
				return nil
			case <-waiting.done:
				continue
			}
		}
		var missing []*ast.SourceFile
		for _, file := range files {
			if entries[file] == nil {
				entries[file] = &cachedDiagnostics{done: make(chan struct{})}
				missing = append(missing, file)
			}
		}
		if len(missing) == 0 {
			var result []*ast.Diagnostic
			for _, file := range files {
				result = append(result, entries[file].diagnostics...)
			}
			c.mu.Unlock()
			return compiler.SortAndDeduplicateDiagnostics(result)
		}
		c.mu.Unlock()

		return c.computeDiagnostics(ctx, program, missing, files, entries)
	}
	return nil
}

func (c *Cache) computeDiagnostics(ctx context.Context, program *compiler.Program, files, requested []*ast.SourceFile, entries map[*ast.SourceFile]*cachedDiagnostics) (result []*ast.Diagnostic) {
	var reports []*ast.Diagnostic
	completed := false
	defer func() {
		c.mu.Lock()
		defer c.mu.Unlock()
		cacheable := completed && ctx.Err() == nil
		failed := make(map[*ast.SourceFile]bool)
		if cacheable {
			for _, diagnostic := range reports {
				if diagnostic.Code() == diagnostics.Lint_plugin_failed_Colon_0.Code() {
					failed[diagnostic.File()] = true
				}
				if entry := entries[diagnostic.File()]; entry != nil {
					entry.diagnostics = append(entry.diagnostics, diagnostic)
				} else {
					// Configuration errors without a file still belong in every document pull.
					for _, file := range files {
						entry := entries[file]
						entry.diagnostics = append(entry.diagnostics, diagnostic)
					}
				}
			}
			for _, file := range requested {
				result = append(result, entries[file].diagnostics...)
			}
			result = compiler.SortAndDeduplicateDiagnostics(result)
		}
		for _, file := range files {
			entry := entries[file]
			if !cacheable || failed[file] || failed[nil] {
				delete(entries, file)
			}
			close(entry.done)
		}
	}()
	reports = GetDiagnosticsForFiles(ctx, program, files)
	completed = true
	return nil
}
