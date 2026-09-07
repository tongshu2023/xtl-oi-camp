// 小图灵信奥学习站 · 数据完整性回归测试（零第三方依赖，node --test）
//
// 这些断言只校验"永远应当成立"的数据契约，而不是把当前样例内容写死：
//   1) 结构完整：两个子系统的 window 数据键都在、非空
//   2) 答案下标不越界：任何选择/小测的 answer 都落在 options 范围内（防止改数据时答案错位）
//   3) 引用完整性：真题卷引用的题 ID 必须真实存在于题库
//   4) 主键唯一：题库 / 编程题 / L3 题的 id 不重复
//   5) 交付清单一致：DELIVERY.md 写下的 8 节课 / 48 卡 / 40 测 / 31 道 L3 题必须与仓库实际吻合
//   6) 选项可作答：任何小题的选项都不得为空串、也不得彼此重复（否则学生会看到重复/空白选项）
//   7) 题干完整：阅读程序 / 完善程序题必须带非空 code，否则题面残缺无法作答
//   8) 引用不重复：同一套真题卷不得把同一道题引用两次
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../scripts/load-data.mjs';

const w = loadData();
const D = w.CSPJ_DATA;

test('CSPJ_DATA 六个核心键齐备', () => {
  for (const k of ['config', 'levels', 'quizBank', 'realExams', 'problems', 'articles']) {
    assert.ok(D[k], `CSPJ_DATA.${k} 缺失`);
  }
});

test('config：真题年份与及格线合法', () => {
  const c = D.config;
  for (const key of ['firstRoundYears', 'secondRoundYears']) {
    assert.ok(Array.isArray(c[key]) && c[key].length > 0, `${key} 应为非空数组`);
    for (const y of c[key]) {
      assert.ok(Number.isInteger(y) && y >= 2000 && y <= 2100, `年份 ${y} 不合理`);
    }
  }
  assert.ok(typeof c.passScore === 'number' && c.passScore > 0 && c.passScore <= 100, 'passScore 应在 (0,100]');
  assert.ok(typeof c.teacherPassphrase === 'string' && c.teacherPassphrase.length > 0, 'teacherPassphrase 不能为空');
});

test('quizBank：id 唯一、section 合法、subs 非空', () => {
  const ids = new Set();
  for (const q of D.quizBank) {
    assert.ok(q.id, '存在没有 id 的题');
    assert.ok(!ids.has(q.id), `题 id 重复：${q.id}`);
    ids.add(q.id);
    assert.ok(['choice', 'reading', 'completion'].includes(q.section), `${q.id} section 非法：${q.section}`);
    assert.ok(Array.isArray(q.subs) && q.subs.length > 0, `${q.id} subs 为空`);
  }
});

test('quizBank：每个小题的 answer 下标都不越界', () => {
  for (const q of D.quizBank) {
    q.subs.forEach((s, i) => {
      assert.ok(Array.isArray(s.options) && s.options.length >= 2, `${q.id} 第 ${i + 1} 小题至少要有 2 个选项`);
      assert.ok(
        Number.isInteger(s.answer) && s.answer >= 0 && s.answer < s.options.length,
        `${q.id} 第 ${i + 1} 小题 answer=${s.answer} 越出 0..${s.options.length - 1}`,
      );
    });
  }
});

test('quizBank：每个小题的选项都非空且互不重复', () => {
  for (const q of D.quizBank) {
    q.subs.forEach((s, i) => {
      const opts = s.options.map((o) => String(o).trim());
      assert.ok(opts.every((o) => o.length > 0), `${q.id} 第 ${i + 1} 小题存在空白选项`);
      assert.equal(new Set(opts).size, opts.length, `${q.id} 第 ${i + 1} 小题选项重复：${JSON.stringify(s.options)}`);
    });
  }
});

test('quizBank：阅读程序 / 完善程序题必须带非空 code', () => {
  for (const q of D.quizBank) {
    if (q.section === 'reading' || q.section === 'completion') {
      assert.ok(typeof q.code === 'string' && q.code.trim().length > 0, `${q.id} section=${q.section} 缺少 code（题面残缺）`);
    }
  }
});

test('realExams：只引用题库中真实存在的题（引用完整性）', () => {
  const bank = new Set(D.quizBank.map((q) => q.id));
  for (const ex of D.realExams) {
    assert.ok(Array.isArray(ex.questionIds) && ex.questionIds.length > 0, `${ex.id} 没有 questionIds`);
    for (const qid of ex.questionIds) {
      assert.ok(bank.has(qid), `真题卷 ${ex.id} 引用了不存在的题 ${qid}`);
    }
  }
});

test('realExams：同一套卷不重复引用同一道题', () => {
  for (const ex of D.realExams) {
    assert.equal(
      new Set(ex.questionIds).size,
      ex.questionIds.length,
      `真题卷 ${ex.id} 重复引用了同一道题：${JSON.stringify(ex.questionIds)}`,
    );
  }
});

test('realExams：覆盖的年份与 config.firstRoundYears 完全一致', () => {
  const cfg = [...D.config.firstRoundYears].sort((a, b) => a - b);
  const got = [...new Set(D.realExams.map((e) => e.year))].sort((a, b) => a - b);
  assert.deepEqual(got, cfg);
});

test('problems：id 唯一、levelId 有效、luoguId 格式正确', () => {
  const levelIds = new Set(D.levels.map((l) => l.id));
  const ids = new Set();
  for (const p of D.problems) {
    assert.ok(!ids.has(p.id), `编程题 id 重复：${p.id}`);
    ids.add(p.id);
    assert.ok(levelIds.has(p.levelId), `编程题 ${p.id} 的 levelId ${p.levelId} 不在 levels 中`);
    if (p.luoguId != null) {
      assert.match(p.luoguId, /^[A-Z]+\d+$/, `编程题 ${p.id} 的 luoguId ${p.luoguId} 格式不对`);
    }
    assert.ok(Array.isArray(p.samples), `${p.id} samples 不是数组`);
  }
});

test('levels：同一主线内 order 连续 1..n 且不重复', () => {
  for (const track of ['preliminary', 'final']) {
    const orders = D.levels.filter((l) => l.track === track).map((l) => l.order).sort((a, b) => a - b);
    assert.ok(orders.length > 0, `主线 ${track} 没有关卡`);
    orders.forEach((o, i) => assert.equal(o, i + 1, `主线 ${track} 的 order 在 ${o} 处断裂`));
  }
});

// ---- 主入口 index.html 的学院数据子系统 ----

test('ACADEMY_DATA：五个板块齐备且非空', () => {
  const A = w.ACADEMY_DATA;
  for (const k of ['regularCourses', 'gesp', 'firstRound', 'secondRound', 'finalLevels']) {
    assert.ok(Array.isArray(A[k]) && A[k].length > 0, `ACADEMY_DATA.${k} 缺失或为空`);
  }
});

test('ACADEMY_DATA：初赛/复赛年度入口的年份连续无缺口', () => {
  const A = w.ACADEMY_DATA;
  for (const key of ['firstRound', 'secondRound']) {
    const years = A[key].map((x) => x.year).sort((a, b) => a - b);
    for (let i = 1; i < years.length; i++) {
      assert.equal(years[i], years[i - 1] + 1, `${key} 年份在 ${years[i - 1]} 之后出现缺口`);
    }
  }
});

test('CSPJ_LESSONS：清单与 DELIVERY 一致（8 节课/48 卡/40 测）且 quiz 答案不越界', () => {
  const lessons = w.CSPJ_LESSONS.lessons ?? w.CSPJ_LESSONS;
  assert.equal(lessons.length, 8, 'DELIVERY.md 声明有 8 节 CSP-J 第一轮课程');
  let cards = 0;
  let quizzes = 0;
  for (const l of lessons) {
    cards += l.memory.length;
    quizzes += l.quiz.length;
    for (const q of l.quiz) {
      assert.ok(Array.isArray(q.options) && q.options.length >= 2, `${l.id} 有小测缺少选项`);
      assert.ok(
        Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length,
        `课程 ${l.id} 的小测 answer=${q.answer} 越界`,
      );
    }
  }
  assert.equal(cards, 48, 'DELIVERY.md 声明有 48 张主动回忆卡');
  assert.equal(quizzes, 40, 'DELIVERY.md 声明有 40 道出口小测');
});

test('CSPJ_LESSONS：每道出口小测的选项都非空且互不重复', () => {
  const lessons = w.CSPJ_LESSONS.lessons ?? w.CSPJ_LESSONS;
  for (const l of lessons) {
    for (const q of l.quiz) {
      const opts = q.options.map((o) => String(o).trim());
      assert.ok(opts.every((o) => o.length > 0), `课程 ${l.id} 的小测存在空白选项`);
      assert.equal(new Set(opts).size, opts.length, `课程 ${l.id} 的小测选项重复：${JSON.stringify(q.options)}`);
    }
  }
});

test('FINAL_LESSONS：S1..S6 六个专题都在且各有课程', () => {
  for (const k of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']) {
    assert.ok(w.FINAL_LESSONS[k], `FINAL_LESSONS.${k} 缺失`);
    assert.ok(
      Array.isArray(w.FINAL_LESSONS[k].lessons) && w.FINAL_LESSONS[k].lessons.length > 0,
      `FINAL_LESSONS.${k} 没有课程`,
    );
  }
});

test('REGULAR_L3_PROBLEMS：31 道 L3 真题、id 唯一、id/title/samples 齐全', () => {
  const ps = w.REGULAR_L3_PROBLEMS;
  assert.equal(ps.length, 31, 'DELIVERY.md 声明有 31 道有道 L3 真实课后题');
  const ids = new Set();
  for (const p of ps) {
    // 部分题目按题号/洛谷 ID 引用录入，statement 允许为空；但 id、title、samples 必须齐备。
    assert.ok(p.id && p.title, `L3 题 ${p.id || '(无 id)'} 缺少 id 或 title`);
    assert.ok(!ids.has(p.id), `L3 题 id 重复：${p.id}`);
    ids.add(p.id);
    assert.ok(Array.isArray(p.samples), `${p.id} samples 不是数组`);
  }
});
