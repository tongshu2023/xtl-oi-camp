// 小图灵信奥学习站 · 教师态答案渲染契约测试（零第三方依赖，node --test）
//
// 背景：app.js 在“教师模式”下会把答案 / 解析 / 参考代码 / 授课要点直接拼进 DOM
//   （见 app.js 中 isTeacher() 守卫的分支：选择题答案面板、编程题完整思路、
//    模考逐题解析、投屏授课视图、信奥百科授课要点）。
//   这些字段只要有一处缺失或为空，老师备课 / 投屏讲题时对应答案区就会“渲染成空白”——
//   这是真实的教学事故：数据本身没错（不越界），但教师看不到该看的内容。
//
// 现有 data-integrity 测试守护的是“数据对不对”（答案下标不越界、引用完整、主键唯一）；
// 本文件补上另一面——“教师态要渲染的答案内容不能是空的”，把这条隐性契约变成回归护栏。
// 当前仓库这些字段 100% 齐备，所以本测试现在全绿；将来灌装 / 编辑内容时若漏填，才会变红。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../scripts/load-data.mjs';

const w = loadData();
const D = w.CSPJ_DATA;

// 判定“可渲染的非空文本”：字符串且去掉首尾空白后仍有内容
const filled = (v) => typeof v === 'string' && v.trim().length > 0;

test('quizBank：每个小题都有非空 explanation（教师态答案面板要用）', () => {
  for (const q of D.quizBank) {
    q.subs.forEach((s, i) => {
      assert.ok(
        filled(s.explanation),
        `题 ${q.id} 第 ${i + 1} 小题缺少 explanation：教师模式答案面板会渲染成空白`,
      );
    });
  }
});

test('problems：每道复赛编程题都有非空 solutionIdea 与 referenceCode（教师态完整思路要用）', () => {
  for (const p of D.problems) {
    assert.ok(
      filled(p.solutionIdea),
      `编程题 ${p.id} 缺少 solutionIdea：教师专属“完整思路”会渲染成空白`,
    );
    assert.ok(
      filled(p.referenceCode),
      `编程题 ${p.id} 缺少 referenceCode：教师专属“参考代码”会渲染成空白`,
    );
  }
});

test('CSPJ_LESSONS：每道出口小测都有非空 explanation（讲评时要用）', () => {
  const lessons = w.CSPJ_LESSONS.lessons ?? w.CSPJ_LESSONS;
  for (const l of lessons) {
    l.quiz.forEach((q, i) => {
      assert.ok(
        filled(q.explanation),
        `课程 ${l.id} 第 ${i + 1} 道小测缺少 explanation：讲评时解析区会空白`,
      );
    });
  }
});

test('articles：teachingNotes 是非空数组且每条都有内容（信奥百科授课要点要用）', () => {
  for (const a of D.articles) {
    assert.ok(
      Array.isArray(a.teachingNotes) && a.teachingNotes.length > 0,
      `文章 ${a.id} 的 teachingNotes 不是非空数组：教师专属“授课要点”会整块消失`,
    );
    a.teachingNotes.forEach((note, i) => {
      assert.ok(
        filled(note),
        `文章 ${a.id} 的第 ${i + 1} 条授课要点为空`,
      );
    });
  }
});
