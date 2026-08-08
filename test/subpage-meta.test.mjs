// 小图灵信奥学习站 · 子页面元信息一致性契约测试（零第三方依赖，node --test）
//
// 背景：sitemap.xml 里每一条 <loc> 都是「我请搜索引擎来收录」的页面。首页 index.html
//   的社交预览与 canonical 已由 head-meta 测试守护；但 sitemap 里的**非首页**（如
//   cspj-lab.html）同样会被抓取、被分享，却容易被漏配——没有 canonical，搜索引擎无法
//   确定权威 URL；没有 og:title/og:image，分享出去是一张白卡。这类缺失「看着没坏」，
//   本文件把「凡进 sitemap 的页面，都必须自带一致的 canonical + 社交预览」变成回归护栏。
//
// 守护的一致性关系（对 sitemap 里除首页外的每个页面）：
//   1) 自带 <link rel="canonical">，且其 href 恰等于它在 sitemap 里的 <loc>（口径不分叉）；
//   2) og:url 与该页 canonical 一致（分享链接与收录链接同一个）；
//   3) og:title 与 og:image 均存在且非空（分享出去不是白卡）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const sitemap = readFileSync(file('sitemap.xml'), 'utf8');
const indexHtml = readFileSync(file('index.html'), 'utf8');

const canonicalOf = (html) => {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return m ? m[1] : null;
};
// 注意：用 String.raw 保留 \s，否则模板字符串会吞掉反斜杠导致正则失效
const metaContent = (html, attr, key) => {
  const re = new RegExp(String.raw`<meta\s+${attr}=["']${key}["']\s+content=["']([^"']*)["']`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
};

const siteCanonical = canonicalOf(indexHtml); // 首页 canonical = 全站权威锚点
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
// 非首页页面：<loc> 不等于首页 canonical，且指向具体 .html 文件
const subPages = locs.filter((loc) => loc !== siteCanonical && loc.endsWith('.html'));

test('sitemap 至少含一个可校验的非首页子页面', () => {
  assert.ok(subPages.length >= 1, 'sitemap 里应至少有一个非首页页面（如 cspj-lab.html）可供校验');
});

for (const loc of subPages) {
  const rel = decodeURIComponent(loc.slice(siteCanonical.length));
  const html = readFileSync(file(rel), 'utf8');

  test(`${rel}：canonical 存在且与 sitemap 的 <loc> 完全一致`, () => {
    const c = canonicalOf(html);
    assert.ok(c, `${rel} 缺少 <link rel="canonical">——它已进 sitemap，搜索引擎却无法确定权威 URL`);
    assert.equal(c, loc, `${rel} 的 canonical(${c}) 与 sitemap 的 <loc>(${loc}) 口径分叉`);
  });

  test(`${rel}：og:url 与本页 canonical 一致`, () => {
    const ogUrl = metaContent(html, 'property', 'og:url');
    assert.ok(ogUrl, `${rel} 缺少 og:url`);
    assert.equal(ogUrl, canonicalOf(html), `${rel} 的 og:url 与 canonical 不一致（分享链接≠收录链接）`);
  });

  test(`${rel}：og:title 与 og:image 均非空（分享不是白卡）`, () => {
    const ogTitle = metaContent(html, 'property', 'og:title');
    const ogImage = metaContent(html, 'property', 'og:image');
    assert.ok(ogTitle && ogTitle.trim(), `${rel} 缺少非空 og:title`);
    assert.ok(ogImage && ogImage.trim(), `${rel} 缺少非空 og:image`);
  });
}
