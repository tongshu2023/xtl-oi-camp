// 小图灵信奥学习站 · 内容数量地板守卫（零第三方依赖，node --test）
//
// data-integrity.test.mjs 已用精确等值守住了集训课（8 节/48 卡/40 测）与有道 L3（31 题）。
// 但 README 首屏对外承诺的头号数字——「70 节常规课、76 节 GESP、复赛 18 节、初赛 2015–2025」——
// 至今没有任何计数断言：check.mjs 只把它们打印出来、从不校验。一旦有人在改数据时
// 静默删掉若干节课，README 就会变成假承诺，而 CI 依旧全绿放行。
//
// 这里补一道「地板」而非「快照」：断言各类内容数量 >= 对外承诺值（允许日后增长，只挡回归），
// 并锁住「total == regular + gesp」这条结构不变量（防止悄悄混入未知 track 把总数凑够）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../scripts/load-data.mjs';

const w = loadData();

// 对外承诺的地板值，逐条对应 README 的公开数字：
//   regular 70 / gesp 76      —— README 首屏 + 「常规课」「GESP 考级课」条目
//   finalLessons 18           —— README「复赛专题 … 共 18 节真课」
//   cspjContent 26            —— README 首屏「26 节 CSP-J 内容课」= 集训 8 节 + 复赛 18 节
//   firstRoundYears 2015..2025 —— README「第二轮入口：2015–2025 年度入口」及初赛真题覆盖
const FLOOR = { regular: 70, gesp: 76, finalLessons: 18, cspjContent: 26, firstYearFrom: 2015, firstYearTo: 2025 };

test('COURSE_CATALOG：常规课/GESP 节数不低于对外承诺，且总数无孤儿 track', () => {
  const lessons = w.COURSE_CATALOG.lessons;
  const byTrack = lessons.reduce((m, l) => ((m[l.track] = (m[l.track] ?? 0) + 1), m), {});
  const regular = byTrack.regular ?? 0;
  const gesp = byTrack.gesp ?? 0;
  assert.ok(regular >= FLOOR.regular, `常规课 ${regular} 节，低于 README 承诺的 ${FLOOR.regular} 节`);
  assert.ok(gesp >= FLOOR.gesp, `GESP 课 ${gesp} 节，低于 README 承诺的 ${FLOOR.gesp} 节`);
  // 结构不变量：课程目录里除 regular / gesp 外不应有其它 track 悄悄把总数凑够。
  assert.equal(lessons.length, regular + gesp, `COURSE_CATALOG 出现未知 track：${Object.keys(byTrack).join(',')}`);
});

test('FINAL_LESSONS：复赛专题总节数不低于对外承诺的 18 节', () => {
  const total = Object.values(w.FINAL_LESSONS).reduce((n, topic) => n + topic.lessons.length, 0);
  assert.ok(total >= FLOOR.finalLessons, `复赛专题共 ${total} 节，低于 README 承诺的 ${FLOOR.finalLessons} 节`);
});

test('CSP-J 内容课合计（集训 + 复赛）不低于对外承诺的 26 节', () => {
  const cspjLessons = (w.CSPJ_LESSONS.lessons ?? w.CSPJ_LESSONS).length;
  const finalLessons = Object.values(w.FINAL_LESSONS).reduce((n, topic) => n + topic.lessons.length, 0);
  assert.ok(
    cspjLessons + finalLessons >= FLOOR.cspjContent,
    `CSP-J 内容课合计 ${cspjLessons + finalLessons} 节，低于 README 首屏承诺的 ${FLOOR.cspjContent} 节`,
  );
});

test('ACADEMY_DATA.firstRound：初赛年度入口仍覆盖 2015–2025 全区间', () => {
  const years = w.ACADEMY_DATA.firstRound.map((x) => x.year);
  const span = FLOOR.firstYearTo - FLOOR.firstYearFrom + 1;
  assert.ok(years.length >= span, `初赛年度入口仅 ${years.length} 年，低于承诺的 ${span} 年`);
  assert.ok(Math.min(...years) <= FLOOR.firstYearFrom, `初赛最早年份为 ${Math.min(...years)}，未覆盖到 ${FLOOR.firstYearFrom}`);
  assert.ok(Math.max(...years) >= FLOOR.firstYearTo, `初赛最晚年份为 ${Math.max(...years)}，未覆盖到 ${FLOOR.firstYearTo}`);
});
