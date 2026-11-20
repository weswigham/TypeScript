package project

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/lint"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"gotest.tools/v3/assert"
)

type localFileLintHost struct {
	lint.Host
	invalidations int
}

func (*localFileLintHost) WatchedFiles() []string {
	return []string{"/repo/plugin.js", "/repo/package.json"}
}
func (h *localFileLintHost) Invalidate() { h.invalidations++ }

func TestLintLocalRootFileUsesExistingModuleNotifications(t *testing.T) {
	t.Parallel()
	host := &localFileLintHost{}
	session := &Session{
		SnapshotHost:    &SnapshotHost{lintPluginHost: host},
		caseSensitivity: tspath.CaseSensitive,
	}
	assert.Assert(t, !session.invalidateLintPlugins([]*lsproto.FileEvent{{
		Uri: "file:///outside/helper.mjs", Type: lsproto.FileChangeTypeChanged,
	}}))
	assert.Assert(t, session.invalidateLintPlugins([]*lsproto.FileEvent{{
		Uri: "file:///repo/tools/helper.mjs", Type: lsproto.FileChangeTypeChanged,
	}}))
	assert.Equal(t, host.invalidations, 1)
}
