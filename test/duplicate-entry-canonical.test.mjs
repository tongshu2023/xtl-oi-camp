// 小图灵信奥学习站 · 重复入口页 canonical 合并契约测试（零第三方依赖，node --test）
//
// 背景：本站是 hash 路由的纯静态 SPA，index.html 与 academy.html 加载完全相同的
//   academy-app.js，二者 <body> 逐字节相同——academy.html 本质是首页的**重复入口**，
//   并非一个内容不同的独立页面。它对搜索引擎/书签呈现与首页一模一样的 <title> 与
//   description，此前却没有 <link rel="canonical">：搜索引擎发现 /academy.html 时无从
//   判断哪个 URL 才是权威，会造成重复内容稀释；/academy.html 的书签也与首页无从区分。
//
//   正确且诚实的做法不是给它编一个「假装不同」的标题（它渲染的就是首页内容），而是
//   给它加 canonical 指向站点首页做重复合并，并**永不**把它写进 sitemap（不请搜索引擎
//   收录一个重复页）。本文件把这条决定固化成回归护栏：
//     1) academy.html 的 <body> 与 index.html 逐字节相同（重复入口这一前提成立；
//        若将来内容分叉，此测试转红，提示重新评估 canonical 策略——护栏而非枷锁）；
//     2) academy.html 自带 canonical，且其 href 恰等于 index.html 的 canonical（合并到
//        权威首页），而非指向它自身的 /academy.html；
//     3) sitemap.xml 不得包含 academy.html（重复页永不提交收录）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const indexHtml = readFileSync(file('index.html'), 'utf8');
const academyHtml = readFileSync(file('academy.html'), 'utf8');
const sitemap = readFileSync(file('sitemap.xml'), 'utf8');

const canonicalOf = (html) => {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return m ? m[1] : null;
};
// 取 <body …> 到 </html> 的整段用于比对；归一行尾（\r\n→\n），
// 避免 Windows 下 CRLF checkout 造成与内容无关的误红
const bodyOf = (html) => {
  const m = html.match(/<body[\s\S]*?<\/html>/i);
  return m ? m[0].replace(/\r\n/g, '\n') : null;
};

test('academy.html 与 index.html 的 <body> 逐字节相同（它是首页的重复入口）', () => {
  const a = bodyOf(academyHtml);
  const b = bodyOf(indexHtml);
  assert.ok(a && b, 'index.html / academy.html 都应能取到 <body>…</html> 区段');
  assert.equal(
    a,
    b,
    'academy.html 的 <body> 已与 index.html 分叉——若它已成为内容不同的独立页面，' +
      '请重新评估 canonical 是否仍应指向首页（本护栏的前提是「重复入口」）',
  );
});

test('academy.html 的 canonical 指向站点首页（重复合并到权威 URL）', () => {
  const site = canonicalOf(indexHtml); // 首页 canonical = 全站权威锚点
  const a = canonicalOf(academyHtml);
  assert.ok(site, 'index.html 应有 <link rel="canonical"> 作为权威锚点');
  assert.ok(
    a,
    'academy.html 缺少 <link rel="canonical">——它是首页重复入口，搜索引擎无法确定权威 URL',
  );
  assert.equal(
    a,
    site,
    `academy.html 的 canonical(${a}) 应等于首页 canonical(${site})，把重复入口合并到权威首页`,
  );
});

test('sitemap.xml 不包含 academy.html（重复页永不提交收录）', () => {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const listed = locs.filter((loc) => loc.endsWith('/academy.html'));
  assert.equal(
    listed.length,
    0,
    `academy.html 是首页重复入口，不应出现在 sitemap（发现 ${listed.length} 处），` +
      '否则等于请搜索引擎收录一个重复页',
  );
});
