// 小图灵信奥学习站 · 主站 app.js「跳过导航」无障碍契约测试（零第三方依赖，node --test）
//
// 背景：index.html 加载的 app.js 是 hash 路由 SPA，每个视图都经由 shell() 渲染，顶部是一条
//   固定不变的导航条（每次切页都重复出现）。与 academy 子应用（见 skip-link-a11y.test.mjs）不同，
//   主站是「逐页 <main>」模型——app.js 源码里 10+ 个视图各自带一个 <main>（class 各异），
//   所以不能像 academy-app.js 那样断言「源码只有 1 个 <main>」。
//
//   主站的诚实最小修复：让 shell() 做两件事——①在导航前置一个默认移出视口、聚焦时才现身的
//   .skip-link 锚点（“跳到主内容”），指向 #main-content；②用 String.replace（只替首个）给内容里
//   第一个 <main 注入 id="main-content" 与 tabindex="-1"（可编程聚焦），保证任意视图渲染出的
//   整页恰有一个可聚焦主地标。这修的是 WCAG 2.4.1（Bypass Blocks）缺口。
//   本文件把这条契约固化成回归护栏：若将来 shell() 被改回无 skip-link、锚点与 id 对不上、
//   或改成 replaceAll/全局替换（给每个 <main 打同一 id 造成重复地标），本测试即转红。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8');
const appJs = read('app.js');
const css = read('styles.css');

// 从 app.js 源码解析 shell() 里对 <main 的注入替换串（单引号定界，替换串内含双引号）。
const injMatch = appJs.match(/\.replace\(\s*'<main',\s*'((?:[^'\\]|\\.)*)'\s*\)/);

test('app.js 的 shell() 前置指向 #main-content 的可见 skip-link', () => {
  const m = appJs.match(/<a\s+class=["']skip-link["']\s+href=["']#([\w-]+)["']>\s*([^<]+?)\s*<\/a>/);
  assert.ok(m, 'shell() 应输出 <a class="skip-link" href="#…">…</a> 跳过导航锚点');
  assert.equal(m[1], 'main-content', `skip-link 应指向 #main-content（实为 #${m[1]}）`);
  assert.ok(m[2].trim().length > 0, 'skip-link 必须有可见文案（读屏用户能听到、键盘用户能看到）');
});

test('shell() 只给内容里第一个 <main 注入 id="main-content"/tabindex="-1"（非 replaceAll/全局）', () => {
  assert.ok(injMatch, "shell() 应含 .replace('<main', '<main id=\"main-content\" tabindex=\"-1\"')");
  const replacement = injMatch[1];
  assert.match(replacement, /^<main\b/, '注入替换串应以 <main 开头（不改变原标签语义，只补属性）');
  assert.match(replacement, /id=["']main-content["']/, '注入的 <main 应带 id="main-content"，与 skip-link 的 href 对齐');
  assert.match(replacement, /tabindex=["']-1["']/, '注入的 <main 应带 tabindex="-1"，使其可被 skip-link 编程聚焦');
  assert.ok(
    !/\.replaceAll\(\s*['"]<main['"]/.test(appJs) && !/\.replace\(\s*\/<main\/g/.test(appJs),
    '不得用 replaceAll / <main>/g 全局替换（会给每个 <main 打上同一 id，造成重复 id 与多主地标）',
  );
});

test('复现 shell() 的首个-<main 注入：含 3 个 <main 的内容渲染后恰有一个 #main-content', () => {
  // 用从 app.js 源码解析出的真实替换串（非重实现），作用在含 3 个 <main 的合成内容上，
  // 证明「只替首个」在真实多视图场景下确实只产出唯一的可聚焦主地标。
  assert.ok(injMatch, '应能从 app.js 解析出 <main 注入替换串');
  const replacement = injMatch[1];
  const sample = '<main class="a">1</main><main class="b">2</main><main class="c">3</main>';
  const rendered = sample.replace('<main', replacement);
  const ids = rendered.match(/id=["']main-content["']/g) || [];
  assert.equal(ids.length, 1, `渲染后应恰有 1 个 #main-content（实得 ${ids.length}）`);
  assert.match(
    rendered,
    /^<main id=["']main-content["'] tabindex=["']-1["'] class="a">/,
    '注入应精确落在第一个 <main 上，且保留其原有属性',
  );
});

test('styles.css 定义了 .skip-link 与 .skip-link:focus（默认藏、聚焦现）', () => {
  assert.match(css, /\.skip-link\s*\{[^}]*\}/, 'styles.css 应有 .skip-link 基础样式');
  assert.match(css, /\.skip-link:focus\s*\{[^}]*\}/, 'styles.css 应有 .skip-link:focus 样式，使其聚焦时进入视口');
});
