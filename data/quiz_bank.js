(function () {
  window.CSPJ_DATA = window.CSPJ_DATA || {};
  window.CSPJ_DATA.quizBank = [
    {
      id: 'SAMPLE-J1-CHOICE-01', year: null, source: 'SAMPLE · 关卡练习', section: 'choice',
      stem: '计算机基础常识单选', code: null,
      subs: [{ stem: 'CPU 的主要职责是什么？', options: ['长期保存文件', '执行指令并处理数据', '显示图像', '连接网线'], answer: 1, explanation: 'CPU 负责取指、译码和执行，是计算机的运算与控制核心。' }],
      knowledgeTags: ['计算机组成', 'CPU'], levelId: 'J1'
    },
    {
      id: 'SAMPLE-J1-CHOICE-02', year: null, source: 'SAMPLE · 过关小测', section: 'choice',
      stem: '网络基础单选', code: null,
      subs: [{ stem: '下列哪一项属于操作系统？', options: ['Linux', 'C++', 'Chrome', 'HTTP'], answer: 0, explanation: 'Linux 是操作系统；C++ 是语言，Chrome 是浏览器，HTTP 是网络协议。' }],
      knowledgeTags: ['操作系统'], levelId: 'J1'
    },
    {
      id: 'SAMPLE-J2-CHOICE-01', year: null, source: 'SAMPLE · 过关小测', section: 'choice',
      stem: '进制转换', code: null,
      subs: [{ stem: '二进制 101101 对应十进制多少？', options: ['43', '44', '45', '46'], answer: 2, explanation: '32+8+4+1=45。' }],
      knowledgeTags: ['二进制'], levelId: 'J2'
    },
    {
      id: 'SAMPLE-J2-CHOICE-02', year: null, source: 'SAMPLE · 过关小测', section: 'choice',
      stem: '存储单位', code: null,
      subs: [{ stem: '通常 1 KiB 等于多少字节？', options: ['1000', '1024', '2048', '4096'], answer: 1, explanation: '二进制存储计量中 1 KiB = 1024 B。' }],
      knowledgeTags: ['存储单位'], levelId: 'J2'
    },
    {
      id: 'SAMPLE-J7-READ-01', year: 2024, source: 'SAMPLE · 阅读程序', section: 'reading',
      stem: '阅读程序并判断每个输出。',
      code: '#include <iostream>\nusing namespace std;\nint main() {\n  int s = 0;\n  for (int i = 1; i <= 4; ++i) s += i * i;\n  cout << s;\n}',
      subs: [
        { stem: '循环结束后 s 的值是？', options: ['10', '20', '30', '40'], answer: 2, explanation: '1²+2²+3²+4²=30。' },
        { stem: '循环体一共执行几次？', options: ['3', '4', '5', '不确定'], answer: 1, explanation: 'i 依次为 1、2、3、4。' }
      ], knowledgeTags: ['循环', '模拟'], levelId: 'J7'
    },
    {
      id: 'SAMPLE-J8-COMPLETE-01', year: 2023, source: 'SAMPLE · 完善程序', section: 'completion',
      stem: '补全二分查找程序。',
      code: 'int find(int a[], int n, int x) {\n  int l = 0, r = n - 1;\n  while (l <= r) {\n    int mid = l + (r - l) / 2;\n    if (a[mid] == x) return mid;\n    if (a[mid] < x) ______;\n    else ______;\n  }\n  return -1;\n}',
      subs: [
        { stem: '第一处应填？', options: ['l = mid + 1', 'l = mid', 'r = mid + 1', 'return mid'], answer: 0, explanation: '中间值偏小，舍弃 mid 及左侧。' },
        { stem: '第二处应填？', options: ['l = mid - 1', 'r = mid - 1', 'r = mid', 'return 0'], answer: 1, explanation: '中间值偏大，右边界移动到 mid-1。' }
      ], knowledgeTags: ['二分查找', '边界'], levelId: 'J8'
    }
  ];
})();
