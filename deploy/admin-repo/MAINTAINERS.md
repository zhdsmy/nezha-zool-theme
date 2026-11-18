# Publish the paired Nezha releases

1. For initial setup, create the public release-only repository `zhdsmy/nezha-zool-admin`. Copy this directory's `README.md` and `.github/workflows/release.yml` to its root and commit them. Keep these two files in sync with this template.
2. In `zhdsmy/nezha-zool-theme`, add the version's notes under a matching heading in `CHANGELOG.md` (for example, `## [0.1.0]`). Push the corresponding version tag (for example, `v0.1.0`) on the intended theme commit.
3. Wait for the theme release to publish. Confirm it lists `dist.zip`, `nezha-zool-admin-dist.zip`, and a `.sha256` for each.
4. Push the **same tag** on the template commit in `zhdsmy/nezha-zool-admin`. Its workflow uses the admin repository's built-in `GITHUB_TOKEN` to read the matching public release, verify the named admin asset and publish those exact bytes as `dist.zip`, with a checksum for the new filename and the theme release notes.
5. Check that Nezha lists the tag under **Settings → Frontends** for each repository. The public frontend uses the theme repository and the management dashboard uses the admin repository.
