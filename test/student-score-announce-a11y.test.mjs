// 小图灵信奥学习站 · 学生自测「读屏播报出分」契约测试（零第三方依赖，node --test）
//
// 背景：投屏授课端（老师）翻页/揭晓已由 sr-announcer 活区读屏播报（见 projector-announce-a11y）。
//   但学生自测端存在同样缺口——两处「出分时刻」读屏用户听不到成绩：
//   ① 过关小测提交（submitQuiz）：结果走 showModal（role=dialog 但不移动焦点），分数只在 <b> 里
//      视觉呈现，读屏用户点「提交」后焦点仍停在按钮，听不到「多少分 / 过没过关」；
//   ② 限时模考交卷（submitExam）：交卷后 SPA 直接 route 到成绩报告页（render 重建 #app），读屏对
//      hash 路由变化几乎不播报，视障考生交卷即「失联」，要自己去翻新页面找分数。
//
//   最小修复（纯加法）：复用常驻 <body> 的同一个 #sr-announcer 活区，把「得分 / 及格线 / 是否过关」
//   （小测）与「得分 / 答对数」（模考）在出分时主动写入，与看屏幕的同学同步得到结果。区域创建与
//   aria-live/atomic 语义由模块级 srAnnounce() 统一承载（与投屏端共用一个活区），本文件锁学生端两处
//   出分路径都调用了 srAnnounce 且播报文本带真实分数。DOM 层「提交后 announcer 文本出现分数」的真实
//   朗读由 playwright e2e 走查证明，本测试锁源码契约，可进 CI（node --test）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8');
const appJs = read('app.js');

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

const submitQuizBody = sliceFunctionBody(appJs, 'function submitQuiz(');
const submitExamBody = sliceFunctionBody(appJs, 'function submitExam(');

test('存在模块级 srAnnounce 活区辅助，供投屏与学生自测共用', () => {
  const body = sliceFunctionBody(appJs, 'function srAnnounce(');
  assert.match(body, /getElementById\(\s*'sr-announcer'\s*\)/, 'srAnnounce 应复用同一个 sr-announcer 节点');
  assert.match(body, /setAttribute\(\s*'aria-live'\s*,\s*'polite'\s*\)/, 'sr-announcer 应为 aria-live="polite"');
  assert.match(body, /setAttribute\(\s*'aria-atomic'\s*,\s*'true'\s*\)/, 'sr-announcer 应为 aria-atomic="true"');
  assert.match(body, /document\.body\.appendChild\(\s*region\s*\)/, 'sr-announcer 应常驻 <body>，不随 render() 销毁');
  assert.match(body, /region\.textContent\s*=\s*message/, 'srAnnounce 应把传入文本写进活区');
});

test('过关小测出分（submitQuiz）调用 srAnnounce 播报分数与及格线', () => {
  // 弹窗不移动焦点，读屏用户提交后必须能主动听到成绩。
  assert.match(submitQuizBody, /srAnnounce\(/, 'submitQuiz 应调用 srAnnounce 播报出分');
  // 播报文本要含真实得分变量 ${score} 与及格线 ${config.passScore}，不能只报一句「已提交」。
  const call = submitQuizBody.match(/srAnnounce\(`[^`]*`\)/);
  assert.ok(call, 'submitQuiz 的 srAnnounce 应以模板串播报');
  assert.match(call[0], /\$\{score\}/, '出分播报应含真实得分 ${score}');
  assert.match(call[0], /\$\{config\.passScore\}/, '出分播报应含及格线 ${config.passScore}');
  // 播报应在出分弹窗之前发起，避免被弹窗逻辑吞掉。
  assert.ok(
    submitQuizBody.indexOf('srAnnounce(') < submitQuizBody.indexOf('showModal('),
    'srAnnounce 应在 showModal 之前调用',
  );
});

test('限时模考交卷（submitExam）调用 srAnnounce 播报分数与答对数', () => {
  // 交卷后 SPA route 到报告页，读屏对路由变化几乎不播报，故交卷即刻主动播报出分。
  assert.match(submitExamBody, /srAnnounce\(`[^`]*`\)/, 'submitExam 应调用 srAnnounce 播报出分');
  const call = submitExamBody.match(/srAnnounce\(`[^`]*`\)/);
  assert.match(call[0], /\$\{record\.score\}/, '交卷播报应含真实得分 ${record.score}');
  assert.match(call[0], /\$\{record\.correct\}/, '交卷播报应含答对数 ${record.correct}');
});
