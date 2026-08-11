// 小图灵信奥学习站 · academy 子应用「跳过导航」无障碍契约测试（零第三方依赖，node --test）
//
// 背景：academy.html 加载的 academy-app.js 是 hash 路由 SPA，每个视图都经由 shell() 渲染，
//   顶部是一条固定不变的导航条（每次切页都重复出现）。此前 shell() 产出的是一个没有 id、
//   也没有跳转锚点的裸 <main>：键盘/读屏用户每进一个视图都要先 Tab 过一整条重复导航才能
//   到正文，且 <main> 主地标不是可聚焦的跳转目标——这是 WCAG 2.4.1（Bypass Blocks）缺口。
//
//   诚实的最小修复不是重排页面，而是给 shell() 补两样东西：①一个默认移出视口、聚焦时才现身的
//   .skip-link 锚点（“跳到主内容”），指向 ②带 id="main-content" 且 tabindex="-1"（可编程聚焦）
//   的唯一 <main> 主地标。本文件把这条契约固化成回归护栏，若将来 shell() 被改回裸 <main>、
//   或跳转锚点与主地标 id 对不上、或出现多个 <main>（嵌套/重复地标），本测试即转红。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8');
const appJs = read('academy-app.js');
const css = read('academy.css');

test('academy-app.js 的 shell() 含指向 #main-content 的可见 skip-link', () => {
  const m = appJs.match(/<a\s+class=["']skip-link["']\s+href=["']#([\w-]+)["']>\s*([^<]+?)\s*<\/a>/);
  assert.ok(m, 'shell() 应输出 <a class="skip-link" href="#…">…</a> 跳过导航锚点');
  assert.equal(m[1], 'main-content', `skip-link 应指向 #main-content（实为 #${m[1]}）`);
  assert.ok(m[2].trim().length > 0, 'skip-link 必须有可见文案（读屏用户能听到、键盘用户能看到）');
});

test('academy-app.js 的 <main> 是唯一主地标，且带 id/tabindex 作为跳转目标', () => {
  const mains = appJs.match(/<main\b[^>]*>/g) || [];
  assert.equal(
    mains.length,
    1,
    `academy-app.js 应恰有 1 个 <main> 主地标（发现 ${mains.length} 个）——多个会造成地标歧义`,
  );
  const main = mains[0];
  assert.match(main, /id=["']main-content["']/, '<main> 应带 id="main-content"，与 skip-link 的 href 对齐');
  assert.match(main, /tabindex=["']-1["']/, '<main> 应带 tabindex="-1"，使其可被 skip-link 编程聚焦');
});

test('skip-link 的 href 锚点与 <main> 的 id 一致（点击后焦点真的落在正文）', () => {
  const href = appJs.match(/class=["']skip-link["']\s+href=["']#([\w-]+)["']/);
  const id = appJs.match(/<main\b[^>]*\bid=["']([\w-]+)["']/);
  assert.ok(href && id, '应同时能取到 skip-link 的 href 锚点与 <main> 的 id');
  assert.equal(href[1], id[1], `skip-link 锚点(#${href[1]}) 应等于 <main> 的 id(${id[1]})`);
});

test('academy.css 定义了 .skip-link 与 .skip-link:focus（默认藏、聚焦现）', () => {
  assert.match(css, /\.skip-link\s*\{[^}]*\}/, 'academy.css 应有 .skip-link 基础样式');
  assert.match(css, /\.skip-link:focus\s*\{[^}]*\}/, 'academy.css 应有 .skip-link:focus 样式，使其聚焦时进入视口');
});
