(function () {
  const regularCourses = [
    { id: 'regular-l1', level: 'L1', title: 'C++ 编程启蒙', subtitle: '输出、变量、输入与顺序结构', lessons: 16, duration: '32 小时', status: 'ready', tags: ['零基础', '常规课'] },
    { id: 'regular-l2', level: 'L2', title: '控制结构与基础算法', subtitle: '分支、循环、函数、数组与字符串', lessons: 20, duration: '40 小时', status: 'ready', tags: ['基础能力', '常规课'] },
    { id: 'regular-l3', level: 'L3', title: '算法与数据结构入门', subtitle: '排序、递归、贪心、栈队列与树', lessons: 16, duration: '32 小时', status: 'ready', tags: ['31 道真实课后题', '有道课程'] },
    { id: 'regular-l4', level: 'L4', title: '竞赛算法进阶', subtitle: '搜索、动态规划、图论与综合训练', lessons: 18, duration: '36 小时', status: 'ready', tags: ['进阶', '完整开放'] }
  ];

  const gesp = [
    ['1级', '顺序结构', '变量、输入输出、基本运算与程序结构', '从“会操作”到“能独立写出短程序”'],
    ['2级', '分支与循环', '条件判断、多分支、for/while 与简单模拟', '能把重复过程准确翻译成循环'],
    ['3级', '数组与字符串', '一维数组、字符与字符串、函数入门', '能处理一组数据与文本'],
    ['4级', '函数与结构化程序', '函数、递推、二维数组、常用算法', '能拆分问题并复用代码'],
    ['5级', '数据结构起步', '栈、队列、排序、查找、复杂度意识', '从写得出走向写得稳'],
    ['6级', '搜索与贪心', '递归、DFS/BFS、贪心与基础图模型', '建立算法选择意识'],
    ['7级', '动态规划与数论', '基础 DP、质数、约数、组合与综合题', '达到 CSP-J 衔接水平'],
    ['8级', '综合算法能力', '图、并查集、最短路、综合建模与优化', '向 CSP-J/S 继续进阶']
  ].map((x, i) => ({ id: `gesp-${i + 1}`, grade: x[0], title: x[1], scope: x[2], outcome: x[3], lessons: i < 2 ? 8 : 10, duration: i < 2 ? '16 小时' : '20 小时' }));

  const firstRound = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(year => {
    const legacy = year < 2019;
    const local = {
      2015: 'content_staging/history/2015_exam.pdf',
      2016: 'content_staging/history/2016_exam.pdf',
      2017: 'content_staging/history/2017_exam.pdf',
      2018: 'content_staging/history/2018_exam.pdf',
      2019: 'content_staging/cspjs2019hj_cpp.pdf',
      2020: 'content_staging/cspjs2020hj_cpp.pdf',
      2021: 'content_staging/_src/2021_exam.pdf',
      2022: 'content_staging/_src/2022_exam.pdf',
      2023: 'content_staging/_pdf/j2023_q.pdf',
      2024: 'content_staging/_pdf/j2024_q.pdf'
    }[year] || null;
    const answer = {
      2015: 'content_staging/history/2015_answer.pdf',
      2016: 'content_staging/history/2016_answer.pdf',
      2017: 'content_staging/history/2017_answer.pdf',
      2018: 'content_staging/history/2018_answer.pdf',
      2019: 'content_staging/cspjs2019hj_sol.pdf',
      2020: 'content_staging/cspjs2020hj_sol.pdf',
      2021: 'content_staging/_src/2021_sol.pdf',
      2022: 'content_staging/_src/2022_ans.pdf',
      2023: 'content_staging/_pdf/j2023_sol.pdf',
      2024: 'content_staging/_pdf/j2024_sol.pdf'
    }[year] || null;
    return {
      id: `first-${year}`, year,
      name: legacy ? `${year} NOIP 普及组初赛` : `${year} CSP-J 第一轮`,
      family: legacy ? 'NOIP 历史衔接卷' : 'CSP-J 正式卷',
      localPaper: local, localAnswer: answer,
      status: local ? 'local' : 'catalog',
      note: year === 2025 ? '已纳入年度目录；CCF 官网尚未公开第一轮题面下载，不用社区扫描件冒充官方卷。' : '按 2 小时正式节奏完成，并做错因复盘。'
    };
  });

  const secondRound = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(year => ({
    id: `second-${year}`, year,
    name: year < 2019 ? `${year} NOIP 普及组复赛` : `${year} CSP-J 第二轮`,
    family: year < 2019 ? 'NOIP 历史衔接卷' : 'CSP-J 正式卷',
    problemCount: 4,
    url: 'https://www.luogu.com.cn/training/370600',
    note: '先独立读题 15 分钟，再看分层提示；代码到洛谷真实提交。'
  }));

  const finalLevels = [
    ['S1', '模拟与枚举', '边界、状态、去重与不重不漏'],
    ['S2', '排序与贪心', '排序建序、交换论证与反例'],
    ['S3', '搜索', 'DFS、BFS、回溯、剪枝与访问标记'],
    ['S4', '递推与动态规划', '状态、转移、初值、顺序与答案'],
    ['S5', '字符串处理', '扫描、统计、匹配与哈希意识'],
    ['S6', '数据结构应用', '栈、队列、优先队列、并查集']
  ].map((x, i) => ({ id: x[0], title: x[1], scope: x[2], lessons: 3, duration: '6 小时', order: i + 1 }));

  window.ACADEMY_DATA = {
    regularCourses,
    gesp,
    firstRound,
    secondRound,
    finalLevels,
    learningPrinciples: [
      { id: 'retrieve', title: '先回忆，再重看', text: '每节课先闭卷唤醒旧知识；想不起来本身就是最准确的诊断。' },
      { id: 'space', title: '按遗忘节奏再见', text: '记忆卡在当天、1、3、7、14、30 天后自动回来，不靠临考突击。' },
      { id: 'interleave', title: '新旧题混着练', text: '练习不按同一套路连刷，让学生先判断“这题该用什么”。' },
      { id: 'feedback', title: '错题先判错因', text: '概念不会、题意误读、程序跟踪、计算失误、策略不当分别处理。' }
    ],
    sources: {
      cspNotice: 'https://www.noi.cn/xw/2025-06-27/845923.shtml',
      noiSyllabus: 'https://noi.ccf.org.cn/cbw/2025-04-18/841594.shtml',
      gespSyllabus: 'https://gesp.ccf.org.cn/101/1008/10012.html',
      luoguTraining: 'https://www.luogu.com.cn/training/list?type=official&page=1'
    }
  };
})();
