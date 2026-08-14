// 小图灵信奥学习站 · 投屏授课「翻页焦点不丢失」契约测试（零第三方依赖，node --test）
//
// 背景：cspj-lab.html 加载的 app.js 里，投屏授课视图（classroomPage / bindClassroom）是幻灯片式
//   操作——老师点「上一页 / 下一页 / 揭晓答案」时，onclick 会调用 render() 把整页 DOM
//   （app.innerHTML）整体重建，被点击的那个按钮随之被销毁重建，浏览器焦点默认掉回 <body>。
//   后果：用键盘 / 翻页笔连续讲课的老师，每翻一页就要重新 Tab 回按钮才能继续——这是投屏
//   授课这一核心教学交互里的真实键盘可用性缺陷（已用 playwright 在线上未修复站复现：
//   点「下一页」后 document.activeElement === document.body）。
//
//   最小修复：bindClassroom 内定义 restoreFocus(preferredId, fallbackId)——翻页 render() 之后把
//   焦点交还给正在驱动的控件；若该控件因翻到首 / 末页被 disabled，则移交对侧按钮，保证键盘流不断。
//   prev → restoreFocus('prev-slide','next-slide')，next / reveal → restoreFocus('next-slide','prev-slide')。
//
//   本文件把这条契约固化成回归护栏：若将来有人把某个 handler 改回「render() 后不恢复焦点」的旧写法，
//   或 restoreFocus 丢掉 disabled 守卫 / fallback，本测试即转红。DOM 层面的真实焦点落点由 playwright
//   e2e 走查证明（见当日 run 的 evidence/），本测试锁的是源码契约，可进 CI（node --test）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8');
const appJs = read('app.js');

// 用花括号配平从 app.js 源码里精确切出 bindClassroom 的函数体，后续断言只作用在该函数内，
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

const body = sliceFunctionBody(appJs, 'function bindClassroom(');

test('bindClassroom 定义了带 disabled 守卫与 fallback 的 restoreFocus 辅助', () => {
  assert.match(body, /restoreFocus\s*=\s*\(\s*preferredId\s*,\s*fallbackId\s*\)\s*=>/, 'restoreFocus 应接收 (preferredId, fallbackId)');
  // preferred 命中且未被 disabled 才聚焦
  assert.match(body, /if\s*\(\s*preferred\s*&&\s*!preferred\.disabled\s*\)\s*\{\s*preferred\.focus\(\)/, 'restoreFocus 应在 preferred 存在且未 disabled 时聚焦它');
  // 否则回落到 fallback（同样需未 disabled）
  assert.match(body, /if\s*\(\s*fallback\s*&&\s*!fallback\.disabled\s*\)\s*fallback\.focus\(\)/, 'restoreFocus 应在 preferred 不可用时回落到未 disabled 的 fallback');
});

test('三个翻页 handler 都在 render() 之后恢复焦点（方向/回落对侧正确）', () => {
  // prev：优先回到自己，翻到首页被禁用则移交 next
  assert.match(
    body,
    /previous\.onclick\s*=\s*\(\)\s*=>\s*\{[^}]*render\(\)\s*;\s*restoreFocus\(\s*'prev-slide'\s*,\s*'next-slide'\s*\)\s*;/,
    "prev handler 应为 render() 后 restoreFocus('prev-slide','next-slide')",
  );
  // next：优先回到自己，翻到末页被禁用则移交 prev
  assert.match(
    body,
    /next\.onclick\s*=\s*\(\)\s*=>\s*\{[^}]*render\(\)\s*;\s*restoreFocus\(\s*'next-slide'\s*,\s*'prev-slide'\s*\)\s*;/,
    "next handler 应为 render() 后 restoreFocus('next-slide','prev-slide')",
  );
  // reveal：揭晓答案后 reveal 按钮消失，焦点交给 next（末页则 prev），让老师可继续
  assert.match(
    body,
    /reveal\.onclick\s*=\s*\(\)\s*=>\s*\{[^}]*render\(\)\s*;\s*restoreFocus\(\s*'next-slide'\s*,\s*'prev-slide'\s*\)\s*;/,
    "reveal handler 应为 render() 后 restoreFocus('next-slide','prev-slide')",
  );
});

test('回归护栏：投屏 handler 不得停在「render() 即收尾、不恢复焦点」的旧写法', () => {
  // 旧 bug 写法：onclick 以 `render(); };` 结束（render 后无 restoreFocus）。
  // 只要三个 handler 里任一个退回该写法，本断言即报红。
  const buggy = body.match(/onclick\s*=\s*\(\)\s*=>\s*\{[^}]*render\(\)\s*;\s*\}/g) || [];
  assert.equal(
    buggy.length,
    0,
    `投屏翻页 handler 不应以 render() 直接收尾而不恢复焦点（发现 ${buggy.length} 处旧写法）`,
  );
});
