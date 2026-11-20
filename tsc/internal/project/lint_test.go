package project

import (
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"gotest.tools/v3/assert"
)

func TestLintPluginWatchPatternsArePackageScoped(t *testing.T) {
	t.Parallel()
	patterns := lintPluginWatchPatterns([]string{
		"C:\\external\\plugin\\index.mjs",
		"C:\\external\\plugin\\*.{js,cjs,mjs,ts,cts,mts,json}",
		"//server/share/plugin/index.mjs",
	}, nil, true, tspath.CaseSensitive)
	assert.Equal(t, len(patterns.directoriesOutsideWorkspace), 0)
	assert.Equal(t, len(patterns.directWatchers), 2)
	for _, watcher := range patterns.directWatchers {
		pattern := watcher.GlobPattern.RelativePattern
		assert.Assert(t, pattern != nil)
		assert.Equal(t, string(*pattern.BaseUri.URI), "file:///c%3A/external/plugin")
		assert.Assert(t, !strings.Contains(pattern.Pattern, "**"))
	}
}

func TestLintPluginWatchPatternsDeduplicatePackageRoots(t *testing.T) {
	t.Parallel()
	for _, relative := range []bool{false, true} {
		patterns := lintPluginWatchPatterns([]string{
			"C:\\external\\node_modules\\plugin\\dist\\index.mjs",
			"C:\\external\\node_modules\\plugin\\package.json",
		}, []string{
			"C:\\external\\node_modules\\plugin\\nested",
			"C:\\external\\node_modules\\plugin",
			"C:\\external\\node_modules\\plugin\\node_modules\\dependency",
			"C:\\external\\node_modules",
		}, relative, tspath.CaseInsensitive)
		assert.Equal(t, len(patterns.directWatchers), 1)
		watcher := patterns.directWatchers[0]
		if relative {
			assert.Equal(t, string(*watcher.GlobPattern.RelativePattern.BaseUri.URI), "file:///c%3A/external/node_modules/plugin")
			assert.Equal(t, watcher.GlobPattern.RelativePattern.Pattern, "**/*")
		} else {
			assert.Equal(t, *watcher.GlobPattern.Pattern, "C:/external/node_modules/plugin/**/*")
		}
	}
}
