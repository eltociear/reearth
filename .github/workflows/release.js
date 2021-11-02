const { writeFileSync } = require("fs");
const { execSync } = require("child_process");

const repos = ["web", "backend"];
const header = "# Changelog\nAll notable changes to this project will be documented in this file.";
const trimFooter = "<!-- generated by git-cliff -->";

module.exports = async ({ github, tag }) => {
  const newTag = removeVFromTag(tag);
  const versions = [[newTag, formatDate(new Date())], ...getVersions().filter(v => v[0] !== newTag)];

  const releaseData = await Promise.all(repos.map(r => github.rest.repos.getReleaseByTag({
    owner: "reearth",
    repo: "reearth-" + r,
    tag: `v${newTag}`,
  })));
  const changelogData = await Promise.all(repos.map(r => github.rest.repos.getContent({
    owner: "reearth",
    repo: "reearth-" + r,
    path: "CHANGELOG.md",
  })));
  const releases = Object.fromEntries(repos.map((r, i) => [
    r,
    releaseData[i]
  ]));
  const changelogs = Object.fromEntries(repos.map((r, i) => [
    r,
    changelogData[i]
  ]));

  const changelogLatest = Object.entries(releases).map(([r, release]) =>
    [`## reearth-${r}`, "", release.body, ""].join("\n")).reduce((a, b) => a + b, "");

  writeFileSync("CHANGELOG_latest.md", changelogLatest);

  const changelogContents = Object.fromEntries(Object.entries(changelogs).map(
    ([k, v]) => [k, devideChangelogIntoSections(Buffer.from(v.data.content, "base64").toString("utf-8"), trimFooter)]));

  const changelog = combineChangelogs(
    header,
    "",
    versions,
    changelogContents,
  );

  writeFileSync("CHANGELOG.md", changelog);
};

function formatDate(d) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function removeVFromTag(t) {
  return t.replace("v", "");
}

function getVersions() {
  return execSync("git tag -l --sort=-creatordate --format='%(refname:short),%(creatordate:iso)'")
    .toString()
    .split("\n")
    .filter(v => v.startsWith("v"))
    .map(t => t.split(","))
    .map(([t, d]) => [removeVFromTag(t), formatDate(new Date(d))])
}

function devideChangelogIntoSections(body, footer) {
  return Object.fromEntries(body.split(/^## /gm).slice(1).map(b => {
    const v = b.match(/^(\d\.\d\.\d.*?) - /);
    if (!v) return;
    return [v[1], b.replace(/.*?\n/, "").replace(footer, "").trim()];
  }).filter(Boolean));
}

/**
 * @param {string} header
 * @param {string} footer
 * @param {[version: string, date: string][]} versions
 * @param {{ [key: string]: { [version: string]: string } }} changes
 */
function combineChangelogs(header, footer, versions, changes) {
  return [
    header,
    ...versions.flatMap(v => [
      `## ${v[0].replace(/^v/, "")} - ${v[1]}`,
      ...Object.entries(changes).flatMap(([key, c]) => c[v[0]] ? [
        `### ${key}`,
        c[v[0]].replace(/^### /gm, "#### ")
      ] : [])
    ]),
    footer
  ].join("\n\n");
}