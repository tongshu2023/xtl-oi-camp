// 小图灵信奥学习站 · 搜索引擎发现性文件契约测试（零第三方依赖，node --test）
//
// 背景：sitemap.xml + robots.txt 决定了这个站能不能被搜索引擎正确发现和收录——
//   sitemap 告诉爬虫「有哪些页面」，robots 告诉爬虫「哪些能抓、sitemap 在哪」。
//   这两个文件和 head-meta 测试守护的社交预览标签是同一类资产：不影响页面渲染，
//   写错了（域名拼错、指向不存在的页面、robots 把全站 Disallow）也“看着没坏”，
//   但搜索引擎会静默拒收或收错。本文件把这些隐性契约变成回归护栏。
//
// 守护的一致性关系：
//   sitemap 的每条 <loc> 都在 canonical 域下且对应仓库里真实存在的页面文件；
//   sitemap 必须包含 index.html 声明的 canonical URL（两处口径不能分叉）；
//   robots.txt 必须指回这份 sitemap，且不能误伤 sitemap 里列出的页面。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const sitemap = readFileSync(file('sitemap.xml'), 'utf8');
const robots = readFileSync(file('robots.txt'), 'utf8');
const indexHtml = readFileSync(file('index.html'), 'utf8');

// index.html 的 canonical 是全站对外 URL 的唯一权威口径（head-meta 测试已守护它与 og:url 一致）
const canonicalMatch = indexHtml.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
assert.ok(canonicalMatch, 'index.html 必须声明 canonical（它是 sitemap 口径的锚点）');
const canonical = canonicalMatch[1]; // 形如 https://tongshu2023.github.io/xtl-oi-camp/

const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

test('sitemap 至少列出两个页面且无重复', () => {
  assert.ok(locs.length >= 2, `sitemap 只有 ${locs.length} 条 <loc>，首页与 cspj-lab 至少应各占一条`);
  assert.equal(new Set(locs).size, locs.length, 'sitemap 存在重复 <loc>');
});

test('sitemap 每条 <loc> 都在 canonical 域下', () => {
  for (const loc of locs) {
    assert.ok(loc.startsWith(canonical), `<loc> ${loc} 不在 canonical（${canonical}）域下——域名或路径口径分叉`);
  }
});

test('sitemap 包含 index.html 声明的 canonical URL', () => {
  assert.ok(locs.includes(canonical), `sitemap 缺少 canonical 首页 ${canonical}`);
});

test('sitemap 每条 <loc> 对应仓库里真实存在的页面文件', () => {
  for (const loc of locs) {
    const rel = loc.slice(canonical.length);
    const target = rel === '' ? 'index.html' : decodeURIComponent(rel);
    assert.ok(existsSync(file(target)), `<loc> ${loc} 指向的文件 ${target} 在仓库中不存在`);
  }
});

test('sitemap 的 lastmod 均为合法的 YYYY-MM-DD 日期', () => {
  const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  assert.equal(lastmods.length, locs.length, '每条 <url> 都应带 lastmod');
  for (const d of lastmods) {
    assert.match(d, /^\d{4}-\d{2}-\d{2}$/, `lastmod「${d}」不是 YYYY-MM-DD 格式`);
    assert.ok(!Number.isNaN(Date.parse(d)), `lastmod「${d}」不是合法日期`);
  }
});

test('robots.txt 指回本站 sitemap（口径与 canonical 一致）', () => {
  const m = robots.match(/^Sitemap:\s*(\S+)\s*$/m);
  assert.ok(m, 'robots.txt 缺少 Sitemap: 行——爬虫将找不到 sitemap');
  assert.equal(m[1], `${canonical}sitemap.xml`, 'robots.txt 的 Sitemap 地址与 canonical 口径不一致');
});

test('robots.txt 不误伤 sitemap 列出的页面', () => {
  const disallows = [...robots.matchAll(/^Disallow:\s*(\S*)\s*$/gm)].map((m) => m[1]);
  for (const loc of locs) {
    const path = `/${loc.slice(canonical.length)}`;
    for (const rule of disallows) {
      assert.ok(
        rule === '' || !path.startsWith(rule),
        `robots.txt 的「Disallow: ${rule}」挡住了 sitemap 页面 ${loc}——收录口径自相矛盾`,
      );
    }
  }
});
