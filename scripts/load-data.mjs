// 在无浏览器的 Node 环境里加载站点的纯数据脚本。
// 每个 data/*.js 都是把内容挂到 window 上的 IIFE，这里用 node:vm 提供一个
// 共享的 window 沙箱，按 index.html / cspj-lab.html 的真实顺序执行它们，
// 再把 window 返回给测试断言。零第三方依赖。
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// 加载顺序覆盖两个子系统：
// - CSPJ_DATA.*（config→articles）：cspj-lab.html 使用
// - ACADEMY_DATA / CSPJ_LESSONS / FINAL_LESSONS / REGULAR_L3_PROBLEMS：index.html 主入口使用
const LOAD_ORDER = [
  'config',
  'levels',
  'quiz_bank',
  'exams_real',
  'problems',
  'articles',
  'academy',
  'course_catalog',
  'cspj_lessons',
  'final_lessons',
  'regular_l3',
];

export function loadData() {
  const context = vm.createContext({ window: {} });
  for (const name of LOAD_ORDER) {
    const file = fileURLToPath(new URL(`../data/${name}.js`, import.meta.url));
    // 去掉可能存在的 UTF-8 BOM（final_lessons.js 带 BOM），否则 vm 会把它当成语法错误。
    const src = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
    vm.runInContext(src, context, { filename: `data/${name}.js` });
  }
  return context.window;
}
