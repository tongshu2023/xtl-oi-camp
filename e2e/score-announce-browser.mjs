// 小图灵信奥学习站 · 学生自测「出分读屏播报」真实浏览器走查（Chrome CDP，无第三方依赖）
//
// 契约测试（test/student-score-announce-a11y.test.mjs）已锁「源码里两处出分路径都调用了 srAnnounce
// 且播报文本带真实分数」，并在注释里承诺「DOM 层『提交后 announcer 文本出现分数』的真实朗读由 e2e
// 走查证明」。本文件即兑现该承诺：真开一个 Chrome，跑通学生的两条出分路径，断言常驻 <body> 的
// #sr-announcer 活区在出分时刻确实被写进了带真实分数的整段文本——这正是读屏器会朗读出来的内容。
//
//   ① 过关小测（submitQuiz）：进关卡 quiz 标签 → 逐题作答 → 提交 → 断言 #sr-announcer 文本
//      形如「过关小测出分：<分> 分，及格线 <分> 分，…」。
//   ② 限时模考（submitExam）：进模考 → 逐题作答 → 交卷确认 → 断言 #sr-announcer 文本
//      形如「模考交卷出分：<分> 分，答对 <对>/<总> 小题」。
//
// 运行前置：先起一个带远程调试的 Chrome，例如
//   chrome --headless=new --remote-debugging-port=9338 --remote-allow-origins=* --user-data-dir=<临时目录> about:blank
// 然后：CDP_URL=http://127.0.0.1:9338 node e2e/score-announce-browser.mjs
// 通过时打印 JSON 摘要（含两段真实播报文本与截图名），并在项目根写下两张证据截图。
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const cdpBase = process.env.CDP_URL || 'http://127.0.0.1:9338';
const projectDir = process.env.PROJECT_DIR || process.cwd();
const pageUrl = process.env.PAGE_URL || pathToFileURL(path.join(projectDir, 'cspj-lab.html')).href;
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function newTarget(url) {
  const response = await fetch(`${cdpBase}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`无法创建 Chrome 测试页：HTTP ${response.status}`);
  return response.json();
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Chrome 调试连接超时')), 8000);
      this.socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Chrome 调试连接失败')); }, { once: true });
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    if (!this.socket || this.socket.readyState >= 2) return;
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 500);
      this.socket.addEventListener('close', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.close();
    });
  }
}

async function main() {
  const target = await newTarget(pageUrl);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();

  async function evaluate(expression) {
    const response = await client.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || '页面脚本执行失败');
    return response.result?.value;
  }

  async function waitFor(expression, timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (await evaluate(expression)) return;
      await delay(80);
    }
    throw new Error(`等待页面状态超时：${expression}`);
  }

  async function screenshot(name) {
    const image = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(projectDir, name), Buffer.from(image.data, 'base64'));
  }

  async function goHash(hash) {
    await evaluate(`location.hash=${JSON.stringify(hash)}`);
    await delay(60);
  }

  // 逐题作答：setAnswer 每次 click 都会 render() 重建 #app，故不能一次性批量点击——
  // 反复「找首个未选中的题组、点它的 A 选项、等重渲染」，直到该 context 的全部小题都已作答。
  async function answerAll(context) {
    for (let step = 0; step < 200; step += 1) {
      const state = await evaluate(`(() => {
        const sel = '[data-answer-context="${context}"]';
        const btns = [...document.querySelectorAll(sel)];
        if (!btns.length) return { total: 0, answered: 0, clicked: null };
        const keys = [...new Set(btns.map(b => b.dataset.answerKey))];
        const isAnswered = key => [...document.querySelectorAll(sel + '[data-answer-key="' + CSS.escape(key) + '"]')]
          .some(x => x.classList.contains('selected'));
        const answered = keys.filter(isAnswered);
        const pending = keys.find(k => !isAnswered(k));
        if (pending) {
          const first = document.querySelector(sel + '[data-answer-key="' + CSS.escape(pending) + '"][data-option-index="0"]');
          if (first) first.click();
        }
        return { total: keys.length, answered: answered.length, clicked: pending || null };
      })()`);
      if (state.total > 0 && state.clicked === null) return state;
      await delay(40);
    }
    throw new Error(`作答未能在限定步数内完成：context=${context}`);
  }

  const evidence = {};
  try {
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await waitFor("document.readyState === 'complete' && !!window.CSPJ_DATA && !!document.querySelector('.shell')");

    // 从数据层动态挑一个「初赛线且有小测题库」的关卡，以及第一套模考——避免把关卡 id 写死。
    const picks = await evaluate(`(() => {
      const d = window.CSPJ_DATA;
      const level = d.levels.find(l => l.track === 'preliminary' && d.quizBank.some(q => q.levelId === l.id));
      const exam = d.realExams[0];
      return {
        levelId: level ? level.id : null,
        passScore: d.config.passScore,
        examId: exam ? exam.id : null,
        examTitle: exam ? exam.title : null
      };
    })()`);
    assert.ok(picks.levelId, '应能在数据层找到一个含小测题库的初赛线关卡');
    assert.ok(picks.examId, '应能在数据层找到至少一套模考');
    evidence.picks = picks;

    // —— ① 过关小测出分播报 ——
    await goHash(`#/level/${picks.levelId}/quiz`);
    await waitFor('document.querySelectorAll(\'[data-answer-context="quiz"]\').length > 0');
    const quizState = await answerAll('quiz');
    await waitFor('/已作答 (\\d+)\\/\\1$/.test((document.getElementById("quiz-progress")||{}).textContent||"")');
    await evaluate("document.getElementById('submit-quiz').click()");
    await waitFor('/过关小测出分/.test((document.getElementById("sr-announcer")||{}).textContent||"")');
    const quizAnnounce = await evaluate('document.getElementById("sr-announcer").textContent');
    assert.match(
      quizAnnounce,
      /^过关小测出分：\d+ 分，及格线 \d+ 分，/,
      '小测出分时 #sr-announcer 应被写入带真实得分与及格线的整段文本'
    );
    assert.match(String(quizAnnounce), new RegExp(`及格线 ${picks.passScore} 分`), '播报的及格线应等于 config.passScore');
    await screenshot('score-announce-quiz-e2e.png');
    // 关掉出分弹窗，进入模考路径（modalRoot 独立于 #app，需显式清空）。
    await evaluate("(document.querySelector('.modal-backdrop')||{}).remove && document.querySelector('.modal-backdrop').remove()");
    evidence.quiz = { levelId: picks.levelId, questions: quizState.total, announce: quizAnnounce };

    // —— ② 限时模考交卷出分播报 —— 走真实入口：模考列表 → 开始 → 确认。
    await goHash('#/exams');
    await waitFor(`!!document.querySelector('[data-start-exam="${picks.examId}"]')`);
    await evaluate(`document.querySelector('[data-start-exam="${picks.examId}"]').click()`);
    await waitFor("!!document.getElementById('modal-confirm')");
    await evaluate("document.getElementById('modal-confirm').click()");
    await waitFor(`location.hash === '#/exam/${picks.examId}' && document.querySelectorAll('[data-answer-context="exam"]').length > 0`);
    const examState = await answerAll('exam');
    await waitFor('/已作答 (\\d+)\\/\\1$/.test((document.getElementById("exam-progress")||{}).textContent||"")');
    await evaluate("document.getElementById('submit-exam-bottom').click()");
    await waitFor("!!document.getElementById('modal-confirm')");
    await evaluate("document.getElementById('modal-confirm').click()");
    await waitFor('/模考交卷出分/.test((document.getElementById("sr-announcer")||{}).textContent||"")');
    const examAnnounce = await evaluate('document.getElementById("sr-announcer").textContent');
    assert.match(
      examAnnounce,
      /^模考交卷出分：\d+ 分，答对 \d+\/\d+ 小题$/,
      '模考交卷时 #sr-announcer 应被写入带真实得分与答对数的整段文本'
    );
    assert.match(String(examAnnounce), new RegExp(`答对 \\d+\\/${examState.total} 小题`), '播报的总题数应等于本卷小题数');
    await screenshot('score-announce-exam-e2e.png');
    evidence.exam = { examId: picks.examId, questions: examState.total, announce: examAnnounce };

    console.log(JSON.stringify({ ok: true, ...evidence, screenshots: ['score-announce-quiz-e2e.png', 'score-announce-exam-e2e.png'] }, null, 2));
  } finally {
    await client.close();
    await fetch(`${cdpBase}/json/close/${target.id}`).catch(() => {});
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
