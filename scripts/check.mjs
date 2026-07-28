// 快速自检：加载全部站点数据并打印内容清单。
// 若任一数据文件加载失败或结构缺失，进程以非零退出码结束，供 `npm run check` 用作门禁。
import { loadData } from './load-data.mjs';

try {
  const w = loadData();
  const D = w.CSPJ_DATA;
  const lessons = w.CSPJ_LESSONS.lessons ?? w.CSPJ_LESSONS;
  const cards = lessons.reduce((n, l) => n + l.memory.length, 0);
  const quizzes = lessons.reduce((n, l) => n + l.quiz.length, 0);

  const required = {
    'CSPJ_DATA.config': D?.config,
    'CSPJ_DATA.quizBank': D?.quizBank,
    'CSPJ_DATA.realExams': D?.realExams,
    'ACADEMY_DATA': w.ACADEMY_DATA,
    'COURSE_CATALOG': w.COURSE_CATALOG,
    'CSPJ_LESSONS': w.CSPJ_LESSONS,
    'FINAL_LESSONS': w.FINAL_LESSONS,
    'REGULAR_L3_PROBLEMS': w.REGULAR_L3_PROBLEMS,
  };
  const missing = Object.entries(required).filter(([, v]) => v == null).map(([k]) => k);
  if (missing.length) {
    console.error('❌ 数据缺失：', missing.join(', '));
    process.exit(1);
  }

  console.log('✅ 数据加载成功，内容清单：');
  console.log(`  初赛题库 quizBank        ${D.quizBank.length} 题`);
  console.log(`  历年真题卷 realExams      ${D.realExams.length} 套`);
  console.log(`  复赛编程题 problems       ${D.problems.length} 题`);
  console.log(`  关卡 levels               ${D.levels.length} 关`);
  console.log(`  常规课完整内容            ${w.COURSE_CATALOG.lessons.filter(x => x.track === 'regular').length} 节`);
  console.log(`  GESP 完整内容             ${w.COURSE_CATALOG.lessons.filter(x => x.track === 'gesp').length} 节`);
  console.log(`  集训课 CSPJ_LESSONS       ${lessons.length} 节 / ${cards} 卡 / ${quizzes} 测`);
  console.log(`  复赛专题 FINAL_LESSONS    ${Object.keys(w.FINAL_LESSONS).length} 个 / ${Object.values(w.FINAL_LESSONS).reduce((n, topic) => n + topic.lessons.length, 0)} 节`);
  console.log(`  有道 L3 真题              ${w.REGULAR_L3_PROBLEMS.length} 题`);
  console.log(`  初赛年度入口 firstRound   ${w.ACADEMY_DATA.firstRound.length} 年`);
} catch (err) {
  console.error('❌ 数据自检失败：', err.message);
  process.exit(1);
}
