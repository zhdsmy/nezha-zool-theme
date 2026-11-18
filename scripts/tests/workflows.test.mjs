import { readFileSync } from 'node:fs'

function workflow(file) {
  return readFileSync(new URL('../../' + file, import.meta.url), 'utf8')
}

it('runs the same pinned setup and checks before packaging a tag', () => {
  const checks = workflow('.github/workflows/checks.yml')
  const release = workflow('.github/workflows/release.yml')
  const steps = (yaml) => yaml.match(/^\s*- (?:uses|run): .*$/gm).map((line) => line.trim())
  const packageAt = release.indexOf('run: python3 scripts/package.py frontend admin')
  expect(packageAt).toBeGreaterThan(0)
  expect(steps(release.slice(0, packageAt))).toEqual(steps(checks))
})

it('uses the repository token for the admin mirror’s release notes request', () => {
  const mirror = workflow('deploy/admin-repo/.github/workflows/release.yml')
  const [job, download] = mirror.split(/^    steps:$/m)
  expect(job).toContain('GH_TOKEN: ${{ github.token }}')
  expect(download).toContain('GH_REPO: zhdsmy/nezha-zool-theme')
  expect(download).toContain('gh release view "$RELEASE_TAG" --json body')
})
