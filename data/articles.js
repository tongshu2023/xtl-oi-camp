(function () {
  window.CSPJ_DATA = window.CSPJ_DATA || {};
  window.CSPJ_DATA.articles = [
    {
      id: 'SAMPLE-ARTICLE-J1', levelId: 'J1', category: '初赛讲义', title: '计算机不是黑盒：从输入到输出',
      summary: '用一张最小地图串起硬件、软件、操作系统和网络。', readTime: 8,
      sections: [
        { title: '四块核心硬件', paragraphs: ['CPU 负责执行指令，内存保存正在使用的数据，外存长期保存文件，输入输出设备连接人与计算机。'] },
        { title: '操作系统是总管', paragraphs: ['操作系统管理硬件资源，并为应用程序提供稳定的运行环境。CSP-J 常考分类、职责和常见实例。'] },
        { title: '网络先认清角色', paragraphs: ['IP 地址帮助定位设备，域名方便人记忆，DNS 把域名翻译为地址，HTTP 约定网页如何传输。'] }
      ],
      teachingNotes: ['投屏先问“删掉操作系统会怎样”，再讲资源管理。', '把 CPU/内存/硬盘比作厨师/操作台/仓库，讲完立刻收回到准确概念。']
    },
    {
      id: 'SAMPLE-ARTICLE-S1', levelId: 'S1', category: '复赛讲义', title: '模拟与枚举：不重不漏才是本事',
      summary: '从范围、状态和检查条件三个问题搭起枚举框架。', readTime: 10,
      sections: [
        { title: '先写候选范围', paragraphs: ['枚举不是乱试。先证明答案一定在什么范围，再让循环完整走过这个范围。'] },
        { title: '再写合法性检查', paragraphs: ['把题目条件翻译成布尔表达式。一个候选通过全部条件，才计入答案。'] },
        { title: '最后检查重复', paragraphs: ['若同一方案能被不同顺序生成，就需要固定顺序、排序或去重。'] }
      ],
      teachingNotes: ['让学生先口述候选集合，再碰代码。', '追问“哪一行保证不漏，哪一行保证不重”。']
    },
    {
      id: 'SAMPLE-WIKI-ROADMAP', levelId: null, category: '信奥百科', title: 'CSP-J 两轮备考路线图',
      summary: '第一轮重知识与读程序，第二轮重独立写程序。', readTime: 6,
      sections: [
        { title: '第一轮', paragraphs: ['按 J1–J8 补齐知识，再用历年卷训练时间分配和错题归因。'] },
        { title: '第二轮', paragraphs: ['按 S1–S6 建立算法工具箱，每道题都经历读题、样例验证、代码草稿和洛谷提交。'] }
      ],
      teachingNotes: ['强调两条线并非互相替代：知识理解与代码能力要同步积累。']
    }
  ];
})();
