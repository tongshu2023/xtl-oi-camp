// 小图灵信奥学习站 · 投屏授课「读屏播报页码与进度」契约测试（零第三方依赖，node --test）
//
// 背景：cspj-lab.html 加载的 app.js 里，投屏授课视图（classroomPage / bindClassroom）每次翻页都会调用
//   render() 把整页 DOM（app.innerHTML）整体重建。08-14 已修好「翻页焦点不丢失」，但读屏用户仍有缺口：
//   ① footer 里的 .slide-dots 是一串纯装饰的空 <i> 圆点，读屏会逐个读成无意义列表项，干扰听感；
//   ② 翻页 / 揭晓后，读屏用户只知道焦点回到了按钮，却不知道翻到了第几页、讲到哪一张——因为放进被
//      render() 重建的 <main> 里的 aria-live 区域是「刚插入的新节点」，主流读屏器不播报其初始内容。
//
//   最小修复（纯加法）：
//   ① .slide-dots 容器加 aria-hidden="true"，把装饰圆点整体对读屏隐藏；
//   ② bindClassroom 内维护一个独立于 #app 容器、常驻 <body> 的 sr-announcer 活区（aria-live=polite /
//      aria-atomic=true，.sr-only 视觉隐藏但读屏可读）；它不随 render() 销毁，翻页 / 揭晓后主动写入
//      「第 X 页，共 Y 页：标题」，让读屏用户与看屏幕的老师同步得到页码与进度。
//
//   本文件把这两条契约固化成回归护栏：若将来有人去掉 slide-dots 的 aria-hidden、或把 announcer 放回会被
//   render() 重建的 #app 内（读屏将失效）、或丢掉 aria-live/atomic 语义，本测试即转红。DOM 层面「翻页后
//   announcer 文本从『第 1 页』变『第 2 页』」的真实播报由 playwright e2e 走查证明（见当日 run 的
//   evidence/），本测试锁的是源码契约，可进 CI（node --test）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8');
const appJs = read('app.js');
const stylesCss = read('styles.css');

// 用花括号配平从 app.js 源码里精确切出指定函数体，后续断言只作用在该函数内，
// 避免误匹配文件别处同名字样。
function sliceFunctionBody(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start !== -1, `源码里应存在 ${signature}`);
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(braceStart, i + 1);
    }
  }
  throw new Error(`${signature} 花括号未闭合`);
}

const classroomBody = sliceFunctionBody(appJs, 'function classroomPage(');
const bindBody = sliceFunctionBody(appJs, 'function bindClassroom(');
// 08-30：区域创建/写入语义收敛进模块级 srAnnounce()，投屏与学生自测共用；活区契约在此断言。
const srAnnounceBody = sliceFunctionBody(appJs, 'function srAnnounce(');

test('投屏 footer 的装饰性 .slide-dots 对读屏隐藏（aria-hidden）', () => {
  // 装饰圆点无信息量，读屏应跳过，改由 sr-announcer 播报真实页码。
  assert.match(
    classroomBody,
    /<div class="slide-dots" aria-hidden="true">/,
    '.slide-dots 容器应带 aria-hidden="true"，避免读屏逐个读空 <i> 圆点',
  );
});

test('srAnnounce 活区带 aria-live / aria-atomic 语义，announceSlide 复用它播报页码', () => {
  // 活区创建与语义已收敛进模块级 srAnnounce()；announceSlide 只负责拼页码文本并委托播报。
  assert.match(srAnnounceBody, /getElementById\(\s*'sr-announcer'\s*\)/, 'srAnnounce 应复用同一个 sr-announcer 节点');
  assert.match(srAnnounceBody, /setAttribute\(\s*'aria-live'\s*,\s*'polite'\s*\)/, 'sr-announcer 应为 aria-live="polite"');
  assert.match(srAnnounceBody, /setAttribute\(\s*'aria-atomic'\s*,\s*'true'\s*\)/, 'sr-announcer 应为 aria-atomic="true"，整段重读');
  assert.match(bindBody, /const\s+announceSlide\s*=\s*\(\)\s*=>/, 'bindClassroom 应定义 announceSlide 辅助');
  assert.match(bindBody, /srAnnounce\(\s*text\s*\)/, 'announceSlide 应委托 srAnnounce(text) 播报');
  // 播报文本需带页码「第 X 页，共 Y 页」，让读屏用户与看屏幕的老师同步进度
  assert.match(bindBody, /第\s*\$\{[^}]*\}\s*页，共\s*\$\{[^}]*\}\s*页/, 'announceSlide 应播报「第 X 页，共 Y 页」页码进度');
});

test('回归护栏：sr-announcer 必须挂在 <body> 上，不能放进会被 render() 重建的 #app 内', () => {
  // 关键：announcer 若挂进 #app，render() 的 app.innerHTML 会把它连同初始文本一起销毁重建，
  // 读屏器不播报「刚插入节点」的内容——修复即失效。故必须常驻 body。
  assert.match(
    srAnnounceBody,
    /document\.body\.appendChild\(\s*region\s*\)/,
    'sr-announcer 应 document.body.appendChild，常驻 body 不随 render() 销毁',
  );
  assert.doesNotMatch(
    srAnnounceBody,
    /app\.appendChild\(\s*region\s*\)|app\.innerHTML[^\n]*sr-announcer/,
    'sr-announcer 不得挂进 #app 容器（会被 render() 重建而失效）',
  );
});

test('三个翻页 / 揭晓 handler 都在 render() 之后播报页码', () => {
  // prev / next / reveal 三处都应以 announceSlide() 收尾，保证每次翻页读屏都能听到新页码。
  const announced = bindBody.match(/render\(\)\s*;\s*restoreFocus\([^)]*\)\s*;\s*announceSlide\(\)\s*;/g) || [];
  assert.equal(
    announced.length,
    3,
    `prev / next / reveal 三个 handler 都应在 restoreFocus 后调用 announceSlide()（发现 ${announced.length} 处）`,
  );
});

test('.sr-only 工具类存在且真正视觉隐藏（读屏仍可读）', () => {
  const rule = stylesCss.match(/\.sr-only\s*\{[^}]*\}/);
  assert.ok(rule, 'styles.css 应定义 .sr-only 工具类');
  assert.match(rule[0], /position:\s*absolute/, '.sr-only 应 position:absolute 脱离布局');
  assert.match(rule[0], /clip:\s*rect\(/, '.sr-only 应用 clip 裁剪而非 display:none（display:none 会让读屏也读不到）');
  assert.doesNotMatch(rule[0], /display:\s*none|visibility:\s*hidden/, '.sr-only 不得用 display:none / visibility:hidden，否则读屏读不到播报');
});
