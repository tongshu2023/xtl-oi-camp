(function () {
  window.CSPJ_DATA = window.CSPJ_DATA || {};
  window.CSPJ_DATA.problems = [
    {
      id: 'SAMPLE-P1001', title: '统计满足条件的数', source: 'SAMPLE · 洛谷风格练习', difficulty: 1,
      knowledgeTags: ['模拟', '枚举'], statement: '输入 n 个整数，统计其中能被 3 整除的数的个数。',
      inputFormat: '第一行一个整数 n；第二行 n 个整数。', outputFormat: '输出满足条件的整数个数。',
      samples: [{ in: '5\n1 3 6 8 9', out: '3' }], hint: '逐个检查每个数除以 3 的余数。',
      solutionIdea: '线性扫描数组，遇到 x % 3 == 0 就把计数器加一。',
      referenceCode: '#include <iostream>\nusing namespace std;\nint main(){\n  int n, x, ans = 0; cin >> n;\n  while(n--){ cin >> x; if(x % 3 == 0) ++ans; }\n  cout << ans;\n}',
      luoguId: 'B2005', levelId: 'S1', year: null
    },
    {
      id: 'SAMPLE-P1002', title: '活动安排入门', source: 'SAMPLE · 贪心练习', difficulty: 2,
      knowledgeTags: ['排序', '贪心'], statement: '给出若干活动的开始与结束时间，选择尽量多的互不重叠活动。',
      inputFormat: '第一行 n，随后 n 行每行 s、t。', outputFormat: '输出最多可参加的活动数量。',
      samples: [{ in: '3\n1 2\n2 4\n1 5', out: '2' }], hint: '优先选择结束时间早的活动。',
      solutionIdea: '按结束时间升序排序，依次选取开始时间不早于上个已选活动结束时间的活动。',
      referenceCode: '#include <algorithm>\n#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  int n; cin >> n; vector<pair<int,int>> a(n);\n  for(auto &p:a) cin >> p.second >> p.first;\n  sort(a.begin(),a.end()); int ans=0,last=-1;\n  for(auto [t,s]:a) if(s>=last){++ans;last=t;}\n  cout<<ans;\n}',
      luoguId: 'P1803', levelId: 'S2', year: null
    },
    {
      id: 'SAMPLE-CSPJ-2024-T1', title: '小木棍（结构样例）', source: 'SAMPLE · 2024 CSP-J 第二轮', difficulty: 3,
      knowledgeTags: ['枚举', '数学'], statement: '给定若干长度，判断并统计能够组成的目标结构。此处为后续真题灌装预留的结构样例。',
      inputFormat: '按正式题面灌装。', outputFormat: '按正式题面灌装。',
      samples: [{ in: '4\n1 1 2 2', out: '1' }], hint: '先观察合法方案的必要条件。',
      solutionIdea: '完整思路仅在教师模式展示：先枚举关键边界，再用计数避免重复。',
      referenceCode: '#include <iostream>\nusing namespace std;\nint main(){\n  // SAMPLE：待替换为正式参考代码\n  return 0;\n}',
      luoguId: 'P11227', levelId: 'S-Boss', year: 2024
    }
  ];
})();
