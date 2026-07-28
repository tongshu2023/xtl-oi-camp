(function () {
  const schedule = [
    ['0–10', '闭卷诊断', '先做一道入口题，暴露已有理解与真实缺口。'],
    ['10–35', '概念建模', '用图、表和最小程序建立本课核心模型。'],
    ['35–55', '例题拆解', '先预测结果，再逐步验证每个状态变化。'],
    ['55–65', '离屏休息', '离开屏幕、活动和喝水，不拿疲劳冒充努力。'],
    ['65–95', '独立练习', '完成跟做题、独立题和一道迁移题。'],
    ['95–110', '改错与讲回', '定位错因，并用自己的话讲回解题流程。'],
    ['110–120', '出口测验', '四题全对才算掌握；未过只补薄弱环节。']
  ];

  const cpp = body => `#include <bits/stdc++.h>
using namespace std;

int main() {
${body.split('\n').map(line => `    ${line}`).join('\n')}
    return 0;
}`;

  const profiles = [
    {
      match: /编译|运行|开发环境|IDE|程序与编译/,
      core: '源代码要经过保存、编译、运行三步才会得到结果；编译错误和运行结果错误是两类问题。',
      rule: '先读编译器指出的第一处错误，再核对分号、括号、变量名和类型；修完后用最小输入运行。',
      example: ['从源码到结果', '新建 main.cpp，输出 Hello，再故意删掉分号观察编译器定位。', '编译器先把 C++ 翻译成可执行程序，操作系统再启动它。'],
      code: cpp('cout << "Hello, CSP!" << \'\\n\';'),
      practice: ['把输出改成两行：姓名和今天的目标。', '解释“能编译”为什么不等于“答案正确”。'],
      answer: ['使用两个 cout 或在文字中加入 \\n。', '编译只证明语法和类型能被翻译，算法与边界仍可能错误。'],
      trap: '只说“程序不行”，却不区分编译失败、运行崩溃和答案错误。',
      check: ['编译器最主要的工作是？', ['把源程序翻译成可执行形式', '替学生证明算法', '保存文件', '连接键盘'], 0, '编译器负责翻译和检查可静态发现的问题，不替你证明算法正确。']
    },
    {
      match: /输出|输入|cin|cout|键盘|格式/,
      core: '输入把外部数据写进变量，输出把程序结果展示出来；读入顺序必须与题目数据顺序一致。',
      rule: '先在纸上列“输入字段→变量→输出字段”，再写 cin 与 cout；输出空格和换行也属于答案。',
      example: ['两数求和', '输入 12 30，输出它们的和。', 'a、b 依次读入，计算后输出 42。'],
      code: cpp('long long a, b;\ncin >> a >> b;\ncout << a + b << \'\\n\';'),
      practice: ['输入长、宽，输出长方形周长。', '输入姓名和分数，按“姓名: 分数”输出。'],
      answer: ['2*(长+宽)，注意用括号。', '先读字符串与整数，再按要求补冒号和空格。'],
      trap: '计算正确但输出多了提示文字、少了空格或换行。',
      check: ['在线评测最关心哪一项？', ['界面颜色', '输出是否严格符合格式', '变量名长度', '注释数量'], 1, '评测器比较输出，额外提示文字也会造成错误。']
    },
    {
      match: /变量|常量|数据类型|整数|浮点|实数|类型选择|long long/,
      core: '变量是带名字的数据盒子；类型决定取值范围、精度和运算规则。',
      rule: '先估算中间结果最大绝对值，再选 int、long long 或 double；金额和计数不要盲用浮点数。',
      example: ['一分钟有多少毫秒', '计算 30 天的毫秒数。', '30×24×60×60×1000=2592000000，超过常见 int 上限，应使用 long long。'],
      code: cpp('long long days = 30;\ncout << days * 24 * 60 * 60 * 1000 << \'\\n\';'),
      practice: ['判断 100000×100000 应选 int 还是 long long。', '解释 double 为什么不宜直接用 == 比较计算结果。'],
      answer: ['结果 10^10，应选 long long。', '浮点数通常是近似表示，运算后可能出现极小误差。'],
      trap: '只看最终答案范围，不看乘法过程中的中间结果溢出。',
      check: ['100000×100000 保存在哪种类型更稳妥？', ['bool', 'char', 'int', 'long long'], 3, '结果为 10^10，超过常见 32 位 int 范围。']
    },
    {
      match: /算术|表达式|优先级|整除|取余|单位换算|坐标|距离|交换/,
      core: '表达式把生活规则翻译成运算；整数除法舍去小数，取余得到分组后的剩余。',
      rule: '先写数学式，再补括号明确顺序；涉及分组时同时检查商和余数。',
      example: ['秒数换算', '输入 3672 秒，输出小时、分钟、秒。', '小时=3672/3600，余下 72；分钟=72/60，秒=72%60。'],
      code: cpp('int total; cin >> total;\ncout << total / 3600 << " "\n     << total % 3600 / 60 << " "\n     << total % 60 << \'\\n\';'),
      practice: ['输入 17 个苹果、每盒装 5 个，输出满盒数和剩余数。', '不使用临时变量，思考交换 a、b 时可能有哪些风险。'],
      answer: ['17/5=3 盒，17%5=2 个。', '算术交换可能溢出；工程中优先 swap(a,b)。'],
      trap: '把 / 当成永远保留小数，或忘记乘除与加减的优先级。',
      check: ['C++ 中 int a=17; a/5 与 a%5 分别是？', ['3 和 2', '3.4 和 0', '2 和 3', '4 和 -3'], 0, '整数除法得到 3，余数为 2。']
    },
    {
      match: /布尔|比较|逻辑|分支|if|条件|分段|区间/,
      core: '条件表达式只有真或假；分支把不同输入区间送到不同处理路径。',
      rule: '先画区间并标出端点，再从最特殊条件写起；数学中的连续比较要拆成两个条件。',
      example: ['成绩等级', '90 分以上 A，60–89 分 B，其余 C。', '先判断 score>=90，再判断 score>=60，最后兜底。'],
      code: cpp('int score; cin >> score;\nif (score >= 90) cout << "A\\n";\nelse if (score >= 60) cout << "B\\n";\nelse cout << "C\\n";'),
      practice: ['写出“x 在闭区间 [10,20]”的 C++ 条件。', '为阶梯水费画出每个边界前、中、后三个测试值。'],
      answer: ['10<=x && x<=20。', '若边界是 10，应至少测 9、10、11。'],
      trap: '把 10<=x<=20 直接照搬进 C++，或让区间端点重复/遗漏。',
      check: ['“x 不在 [10,20]”应写成？', ['x<10 || x>20', 'x<10 && x>20', '10<=x<=20', 'x!=10 && x!=20'], 0, '区间外表示小于左端点或大于右端点。']
    },
    {
      match: /for|while|循环|重复|累加|计数|最大最小|拆解一个整数/,
      core: '循环由初值、继续条件、每轮工作和推进方式组成；少一项就可能漏算或不终止。',
      rule: '先写清“第 i 轮开始时变量代表什么”，再检查首轮、末轮和循环结束后的状态。',
      example: ['统计各位数字之和', '输入 583，输出 5+8+3。', '每轮用 n%10 取末位，再用 n/=10 去掉末位。'],
      code: cpp('long long n; cin >> n;\nint sum = 0;\nwhile (n > 0) {\n    sum += n % 10;\n    n /= 10;\n}\ncout << sum << \'\\n\';'),
      practice: ['用 for 求 1 到 n 的和。', '输入若可能为 0，数字位数统计应怎样处理？'],
      answer: ['初始化 sum=0，每轮加 i。', '先单独判断 n==0，位数为 1。'],
      trap: '边界写成 <= 导致多一轮，或忘记更新循环变量造成死循环。',
      check: ['for(int i=0;i<n;i++) 一共执行几次？', ['n-1', 'n', 'n+1', '不确定'], 1, 'i 依次为 0 到 n-1，共 n 次。']
    },
    {
      match: /嵌套循环|二维枚举/,
      core: '外层每执行一次，内层会完整执行；总次数通常是各层次数的乘积。',
      rule: '先给两层变量分别命名含义，再画一个小网格检查遍历顺序与边界。',
      example: ['打印乘法表', '输出 1×1 到 9×9 的下三角。', 'i 表示行与第二个因数，j 从 1 遍历到 i。'],
      code: cpp('for (int i = 1; i <= 9; i++) {\n    for (int j = 1; j <= i; j++)\n        cout << j << "*" << i << "=" << i*j << " ";\n    cout << \'\\n\';\n}'),
      practice: ['n 行 m 列网格一共访问多少格？', '枚举 i<j 的无序数对，内层起点应怎样写？'],
      answer: ['n*m。', '让 j=i+1，可避免自身配对和重复顺序。'],
      trap: '两层边界含义相反，或把 O(nm) 不加判断地说成 O(n²)。',
      check: ['两层循环分别执行 n 次和 m 次，总次数约为？', ['n+m', 'n*m', 'max(n,m)', 'log n'], 1, '内层会对外层每一次完整执行。']
    },
    {
      match: /字符|字符串|ASCII|编码|逐字符/,
      core: '字符是单个编码值，字符串是字符序列；下标从 0 开始，长度为 n 时最后位置是 n-1。',
      rule: '先确定是读一个单词还是整行，再逐字符扫描；涉及大小写时明确编码范围。',
      example: ['统计数字字符', '输入一行文本，统计其中 0–9 的数量。', 'getline 读整行，逐个判断 c>="0" 且 c<="9"。'],
      code: cpp('string s; getline(cin, s);\nint cnt = 0;\nfor (char c : s) if (c >= \'0\' && c <= \'9\') cnt++;\ncout << cnt << \'\\n\';'),
      practice: ['统计字符串中元音字母个数。', '解释 cin>>s 与 getline(cin,s) 的差别。'],
      answer: ['逐字符判断 a/e/i/o/u，可先统一为小写。', 'cin 按空白分隔，getline 读取整行。'],
      trap: '混用 cin 和 getline 时未处理残留换行，或访问 s[s.size()]。',
      check: ['长度为 n 的字符串最后一个合法下标是？', ['n', 'n-1', '1', '取决于内容'], 1, '下标从 0 开始，因此范围是 0 到 n-1。']
    },
    {
      match: /函数|参数|返回值|作用域/,
      core: '函数把一个职责封装成可复用能力；参数是输入，返回值是输出，局部变量只在自己的作用域有效。',
      rule: '函数名写动作，参数只传必要数据；先写清契约，再实现函数体并单独测试。',
      example: ['判断质数', '写 isPrime(n)，对 2、9、17 返回正确结果。', '小于 2 为假，只需检查到 sqrt(n)。'],
      code: `#include <bits/stdc++.h>
using namespace std;
bool isPrime(int n) {
    if (n < 2) return false;
    for (int d = 2; d * d <= n; d++)
        if (n % d == 0) return false;
    return true;
}
int main() { int n; cin >> n; cout << (isPrime(n) ? "YES" : "NO") << '\\n'; }`,
      practice: ['写 max3(a,b,c) 返回三个数最大值。', '值传递为什么不会直接修改调用者变量？'],
      answer: ['可两次使用 max，或逐个比较。', '函数得到的是实参副本。'],
      trap: '函数既修改全局状态又返回结果，职责不清；或漏写某条返回路径。',
      check: ['值传递时函数参数是什么？', ['调用者变量本身', '实参的副本', '固定常量', '文件'], 1, '值传递复制数据，函数内修改副本不改变原变量。']
    },
    {
      match: /指针|引用传递/,
      core: '指针保存地址，引用是对象的别名；它们都能让函数接触调用者对象，但语义和安全边界不同。',
      rule: '只在需要修改原对象或避免大对象复制时使用引用；指针使用前必须确认有效且非空。',
      example: ['引用交换', '写函数交换两个整数。', '引用参数 a、b 直接指向调用者变量。'],
      code: `#include <bits/stdc++.h>
using namespace std;
void exchange(int& a, int& b) { int t=a; a=b; b=t; }
int main(){ int x,y; cin>>x>>y; exchange(x,y); cout<<x<<" "<<y<<"\\n"; }`,
      practice: ['解释 &x 在参数声明中的含义。', '空指针解引用为什么危险？'],
      answer: ['表示 x 是调用者对象的引用。', '它不指向有效对象，访问会产生未定义行为。'],
      trap: '把取地址符、引用声明和按位与看到同一个 & 就混为一谈。',
      check: ['引用参数最直接的能力是？', ['自动排序', '修改调用者对象', '提升网络速度', '创建文件'], 1, '引用是调用者对象的别名。']
    },
    {
      match: /结构体|类|面向对象/,
      core: '结构体或类把同一个对象的多项数据和操作组织在一起，减少平行数组错位。',
      rule: '字段名表达业务含义；排序时把全部优先级写进比较函数，并处理相等情况。',
      example: ['学生排名', '按总分降序、学号升序输出。', 'Student 同时保存 id 与 score，比较器先比 score 再比 id。'],
      code: `#include <bits/stdc++.h>
using namespace std;
struct Student { int id, score; };
int main(){ int n; cin>>n; vector<Student>a(n); for(auto&x:a)cin>>x.id>>x.score;
sort(a.begin(),a.end(),[](const Student&x,const Student&y){return x.score!=y.score?x.score>y.score:x.id<y.id;});
for(auto x:a) cout<<x.id<<" "<<x.score<<"\\n"; }`,
      practice: ['设计 Point 保存二维坐标。', '排名比较器漏掉同分规则会有什么后果？'],
      answer: ['包含 x、y 两个字段。', '相同主关键字时顺序不符合题意，结果可能不稳定。'],
      trap: '比较函数在相等对象上仍返回 true，破坏严格排序规则。',
      check: ['结构体最适合解决哪类问题？', ['把同一对象的多个字段组织起来', '替代所有循环', '自动证明算法', '压缩图片'], 0, '结构体把相关字段组合成一个对象。']
    },
    {
      match: /数组|矩阵|二维/,
      core: '数组用连续下标管理同类型数据；二维数组把位置表示为行、列两个坐标。',
      rule: '长度为 n 的合法下标是 0..n-1；遍历矩阵时先约定 i 是行、j 是列。',
      example: ['数组最大值', '读入 n 个整数，输出最大值及首次出现位置。', '用第一个元素初始化答案，随后从下标 1 开始比较。'],
      code: cpp('int n; cin >> n;\nvector<int> a(n);\nfor (int& x : a) cin >> x;\nint pos = 0;\nfor (int i = 1; i < n; i++) if (a[i] > a[pos]) pos = i;\ncout << a[pos] << " " << pos << \'\\n\';'),
      practice: ['统计数组中大于平均数的元素个数。', '遍历 n×m 矩阵主对角线需要什么条件？'],
      answer: ['先求总和与平均值，再第二遍统计。', '方阵中位置满足 i==j。'],
      trap: '用 0 初始化最大值，遇到全负数时得到不存在的答案。',
      check: ['vector<int> a(n) 的合法下标范围是？', ['1..n', '0..n', '0..n-1', '-1..n-1'], 2, '长度 n 的序列从 0 编号到 n-1。']
    },
    {
      match: /排序|冒泡|选择|插入|快速排序/,
      core: '排序是按明确规则重排数据；规则可能包含多个关键字，稳定性描述相等元素的相对次序。',
      rule: '先写比较规则的自然语言版本，再编码；数据大时优先使用标准库 O(n log n) 排序。',
      example: ['成绩排序', '按分数降序，分数相同按编号升序。', '比较器先处理分数不同，再处理编号。'],
      code: cpp('int n; cin >> n;\nvector<pair<int,int>> a(n);\nfor (auto& [id,score] : a) cin >> id >> score;\nsort(a.begin(), a.end(), [](auto x, auto y){\n    if (x.second != y.second) return x.second > y.second;\n    return x.first < y.first;\n});\nfor (auto [id,score] : a) cout << id << " " << score << \'\\n\';'),
      practice: ['按字符串长度升序，长度相同按字典序排序。', '解释冒泡排序为什么是 O(n²)。'],
      answer: ['比较 size()，相同再比较字符串。', '最坏需要多轮相邻比较，总比较次数约 n(n-1)/2。'],
      trap: '比较器只写第一个关键字，或相等时仍返回 true。',
      check: ['比较排序处理 10^5 个元素通常应争取什么复杂度？', ['O(n!)', 'O(n²)', 'O(n log n)', 'O(2^n)'], 2, 'n log n 是标准库排序的典型复杂度。']
    },
    {
      match: /顺序查找|二分查找|二分答案|单调/,
      core: '二分每次排除一半范围，但必须有序或具有单调的可行性边界。',
      rule: '明确区间是闭还是半开，循环中必须严格缩小区间；二分答案先写 check(x)。',
      example: ['查找第一个不小于 x 的位置', '在有序数组中找到 lower_bound。', '维护半开区间 [l,r)，mid 不满足时 l=mid+1，否则 r=mid。'],
      code: cpp('int n, x; cin >> n >> x;\nvector<int> a(n); for (int& v : a) cin >> v;\nint l=0, r=n;\nwhile(l<r){ int m=l+(r-l)/2; if(a[m]<x) l=m+1; else r=m; }\ncout << l << \'\\n\';'),
      practice: ['在有序数组中找最后一个 <=x 的位置。', '二分答案时 check(x) 为什么必须单调？'],
      answer: ['可找第一个 >x 的位置再减 1。', '否则排除一半时可能把可行答案一起丢掉。'],
      trap: '写 l=mid 或 r=mid 却没有证明区间会缩小，造成死循环。',
      check: ['二分查找最关键的前提是？', ['元素互不相同', '有序或判定单调', '长度为偶数', '必须递归'], 1, '没有单调性就不能安全排除一半范围。']
    },
    {
      match: /枚举/,
      core: '枚举先定义候选空间，再不重不漏地产生候选并检查全部条件。',
      rule: '用数据范围估算候选数；能由前面变量推出的量不要再多开一层循环。',
      example: ['鸡兔同笼', '总头数 n、总脚数 m，求鸡兔数量。', '枚举鸡数 c，兔数 r=n-c，只检查 2c+4r==m。'],
      code: cpp('int n,m; cin>>n>>m;\nfor(int c=0;c<=n;c++){\n    int r=n-c;\n    if(2*c+4*r==m) cout<<c<<" "<<r<<"\\n";\n}'),
      practice: ['枚举三位数中各位数字和等于 10 的数。', '为什么鸡兔同笼不需要同时枚举 c 和 r？'],
      answer: ['从 100 到 999 扫描并拆位求和。', 'r 可由 n-c 唯一推出，减少一层循环。'],
      trap: '候选范围没有证明，或重复枚举可以直接推导的变量。',
      check: ['高质量枚举的两个标准是？', ['代码短、变量少', '不重、不漏', '只测样例', '必须三层循环'], 1, '候选必须完整覆盖且不重复。']
    },
    {
      match: /模拟/,
      core: '模拟按题目规则推进最少必要状态，重点是事件顺序和同一时刻的更新方式。',
      rule: '先列状态表和事件表；若同一步多个量互相影响，使用旧状态计算新状态。',
      example: ['自动售货机', '按顺序处理投币、购买、找零事件。', '余额是核心状态，每个事件只按规则更新一次。'],
      code: cpp('int balance=0, q; cin>>q;\nwhile(q--){ string op; int x; cin>>op>>x;\n    if(op=="ADD") balance+=x;\n    else if(balance>=x) balance-=x;\n}\ncout<<balance<<"\\n";'),
      practice: ['模拟一串 L/R 指令后机器人方向。', '两个角色同时移动时为何常要保存旧位置？'],
      answer: ['用 0..3 表示方向，左转 +3、右转 +1 后模 4。', '避免先更新的角色影响同一时刻另一个角色的判断。'],
      trap: '把题意中“同时发生”写成顺序更新，结果依赖代码先后。',
      check: ['模拟题最先应明确什么？', ['代码行数', '状态与事件更新顺序', '变量名颜色', '是否用递归'], 1, '状态和更新顺序决定模拟是否忠实。']
    },
    {
      match: /复杂度|数据规模|效率|时间分配|优化/,
      core: '复杂度描述规模增长时操作次数的增长速度；先看 n 的上限，再判断算法能否跑完。',
      rule: '只保留最高阶增长项，但别忽略常数极大的操作和内存上限。',
      example: ['10^5 数据能否双重枚举', '比较 O(n²) 与 O(n log n)。', '10^10 次通常不可接受，而排序约数百万次比较。'],
      code: cpp('int n; cin>>n;\nlong long operations = 1LL*n*n;\ncout << operations << \'\\n\';'),
      practice: ['判断 i 每次乘 2 的循环复杂度。', 'n=5000 时 O(n²) 大约多少次？'],
      answer: ['O(log n)。', '约 2500 万次，需结合时限与操作常数评估。'],
      trap: '看到两层循环就一律判 O(n²)，没检查内层次数是否随外层变化。',
      check: ['for(i=1;i<n;i*=2) 的复杂度是？', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 1, 'i 每次翻倍，执行次数约为 log₂n。']
    },
    {
      match: /前缀和/,
      core: '前缀和把重复区间求和变成两个累计值相减，用一次预处理换取多次快速查询。',
      rule: '定义 pre[i] 为前 i 个元素之和，则闭区间 [l,r] 的和是 pre[r+1]-pre[l]。',
      example: ['多次区间和', '数组 2,5,1,4，查询下标 1..3。', 'pre 为 0,2,7,8,12，答案 12-2=10。'],
      code: cpp('int n,q; cin>>n>>q;\nvector<long long> pre(n+1);\nfor(int i=0,x;i<n;i++){cin>>x;pre[i+1]=pre[i]+x;}\nwhile(q--){int l,r;cin>>l>>r;cout<<pre[r+1]-pre[l]<<"\\n";}'),
      practice: ['写出二维前缀和矩形查询的加减关系。', '为什么 pre 要多开一个 0？'],
      answer: ['右下-上方-左方+左上重复部分。', '统一处理从 0 开始的区间，避免 l=0 特判。'],
      trap: 'l、r 是 0 下标却套 1 下标公式，产生差一位错误。',
      check: ['pre[i] 表示前 i 个元素和时，[l,r] 的和是？', ['pre[r]-pre[l]', 'pre[r+1]-pre[l]', 'pre[r]+pre[l]', 'pre[l+1]-pre[r]'], 1, '右端包含 r，所以取到 pre[r+1]。']
    },
    {
      match: /差分/,
      core: '差分记录相邻变化，能把多次区间统一加减变成端点更新，最后一次前缀还原。',
      rule: '给闭区间 [l,r] 加 v：diff[l]+=v，若 r+1 存在则 diff[r+1]-=v。',
      example: ['区间加法', '长度 5 全为 0，给 [1,3] 加 2。', '差分在 1 加 2、4 减 2，前缀还原为 0,2,2,2,0。'],
      code: cpp('int n,m; cin>>n>>m;\nvector<long long>d(n+1);\nwhile(m--){int l,r,v;cin>>l>>r>>v;d[l]+=v;if(r+1<n)d[r+1]-=v;}\nlong long cur=0;for(int i=0;i<n;i++){cur+=d[i];cout<<cur<<" ";}'),
      practice: ['原数组不全为 0 时怎样建立差分？', '区间更新后为何不能直接把 diff 当答案？'],
      answer: ['d[0]=a[0]，d[i]=a[i]-a[i-1]。', 'diff 保存变化量，需要前缀累加还原。'],
      trap: '忘记 r+1 的撤销点，导致影响延伸到数组末尾。',
      check: ['给 [l,r] 加 v 的差分更新是？', ['d[l]+=v,d[r]-=v', 'd[l]+=v,d[r+1]-=v', '每项都排序', '只改 d[r]'], 1, 'r+1 处撤销，保证影响恰好到 r。']
    },
    {
      match: /递归|调用栈|分治/,
      core: '递归让函数解决更小的同类问题；必须有终止条件，并保证规模向它靠近。',
      rule: '先写函数含义和终止条件，再写如何拆小；重复子问题多时改为记忆化或递推。',
      example: ['快速幂', '计算 a^n，每次把指数减半。', 'n 偶数用 half²，奇数再乘 a。'],
      code: `#include <bits/stdc++.h>
using namespace std;
long long power(long long a,long long n){ if(n==0)return 1; long long h=power(a,n/2); return n%2?h*h*a:h*h; }
int main(){long long a,n;cin>>a>>n;cout<<power(a,n)<<"\\n";}`,
      practice: ['递归求数组前 n 项和。', '斐波那契朴素递归为什么慢？'],
      answer: ['sum(n)=sum(n-1)+a[n-1]，sum(0)=0。', '大量相同子问题被重复计算，时间呈指数增长。'],
      trap: '只有终止条件却没有保证每次调用规模变小。',
      check: ['递归正确终止需要什么？', ['全局变量', '终止条件且规模向它靠近', '必须返回 int', '只能调用一次'], 1, '缺任一项都可能无限递归。']
    },
    {
      match: /贪心|区间调度/,
      core: '贪心每一步做局部选择，但只有能证明“这样选不会损失最优解”才成立。',
      rule: '提出选择规则后尝试交换论证：把任意最优方案的第一步换成贪心选择，结果不变差。',
      example: ['最多参加活动', '活动有开始和结束时间，选最多个互不冲突活动。', '按结束时间升序，每次选第一个能接上的活动。'],
      code: cpp('int n;cin>>n;vector<pair<int,int>>a(n);\nfor(auto&[r,l]:a)cin>>l>>r;\nsort(a.begin(),a.end());\nint last=-1,cnt=0;for(auto[r,l]:a)if(l>=last){cnt++;last=r;}\ncout<<cnt<<"\\n";'),
      practice: ['解释为什么活动要按结束时间而非开始时间选。', '找零贪心在任意面额系统都正确吗？'],
      answer: ['越早结束给后续留下的时间不更少，可交换到最优方案。', '不一定，例如面额 1、3、4，找 6 时贪心得 4+1+1，不如 3+3。'],
      trap: '样例通过就宣称贪心正确，没有证明或反例搜索。',
      check: ['哪项不能单独证明贪心正确？', ['交换论证', '反证法', '结构证明', '样例全部通过'], 3, '有限样例不能覆盖所有输入。']
    },
    {
      match: /栈|括号/,
      core: '栈是后进先出结构，适合处理最近尚未完成的任务、括号和单调关系。',
      rule: '明确栈中每个元素的含义；弹栈前先判空，处理完成后检查是否仍有未匹配元素。',
      example: ['括号匹配', '判断 ()[]{} 是否正确配对。', '左括号入栈，右括号必须与栈顶同型。'],
      code: cpp('string s;cin>>s;stack<char>st;bool ok=true;\nfor(char c:s){if(c==\'(\'||c==\'[\'||c==\'{\')st.push(c);else{if(st.empty()){ok=false;break;}char t=st.top();st.pop();if((c==\')\'&&t!=\'(\')||(c==\']\'&&t!=\'[\')||(c==\'}\'&&t!=\'{\'))ok=false;}}\ncout<<(ok&&st.empty()?"YES":"NO")<<"\\n";'),
      practice: ['用栈模拟浏览器后退。', '表达式求值时运算符栈解决什么问题？'],
      answer: ['访问新页时入栈，后退时弹出当前页。', '保存尚不能计算的运算符并处理优先级。'],
      trap: '遇到右括号直接 top()，没先检查空栈。',
      check: ['栈的访问顺序是？', ['先进先出', '后进先出', '随机访问', '按值排序'], 1, '最后压入的元素最先弹出。']
    },
    {
      match: /链表|链式关系/,
      core: '链表用结点和链接关系组织数据，局部插删不必整体搬移，但按位置访问需要沿链接逐步行走。',
      rule: '先画结点与 next 指向，再修改链接；删除或插入时保存后继，避免丢失剩余链。',
      example: ['单链表头插', '把新结点插到链表最前面。', '新结点 next 指向原头结点，再把 head 更新为新结点。'],
      code: `#include <bits/stdc++.h>
using namespace std;struct Node{int value;Node* next;};
int main(){Node* head=nullptr;for(int x:{3,2,1})head=new Node{x,head};for(Node*p=head;p;p=p->next)cout<<p->value<<" ";}`,
      practice: ['在结点 p 后插入新结点需要哪两次链接更新？', '数组与链表谁更适合频繁按下标读取？'],
      answer: ['newNode->next=p->next，再令 p->next=newNode。', '数组可直接定位下标，更适合随机访问。'],
      trap: '先覆盖 p->next，导致原后继结点及后续链丢失。',
      check: ['链表相对数组的典型优势是？', ['随机访问更快', '已知位置的局部插删少搬移', '自动有序', '不需要内存'], 1, '链表通过修改链接完成局部插删。']
    },
    {
      match: /队列|广度优先|BFS|泛洪/,
      core: '队列先进先出；广度优先搜索按距离一层层扩展，第一次到达就是无权图最短步数。',
      rule: '入队时立刻标记访问，避免同一状态被多个父节点重复加入队列。',
      example: ['迷宫最少步数', '0 可走、1 障碍，从起点到终点。', '队列保存位置，dist 保存首次到达步数。'],
      code: `#include <bits/stdc++.h>
using namespace std;
int main(){int n,m;cin>>n>>m;vector<string>g(n);for(auto&s:g)cin>>s;vector<vector<int>>d(n,vector<int>(m,-1));queue<pair<int,int>>q;q.push({0,0});d[0][0]=0;int dx[4]={1,-1,0,0},dy[4]={0,0,1,-1};while(!q.empty()){auto[x,y]=q.front();q.pop();for(int k=0;k<4;k++){int nx=x+dx[k],ny=y+dy[k];if(nx>=0&&nx<n&&ny>=0&&ny<m&&g[nx][ny]==\'0\'&&d[nx][ny]<0){d[nx][ny]=d[x][y]+1;q.push({nx,ny});}}}cout<<d[n-1][m-1]<<"\\n";}`,
      practice: ['为什么 BFS 入队时标记而不是出队时？', '带权图还能直接用普通 BFS 求最短路吗？'],
      answer: ['防止重复入队造成状态爆炸。', '一般不能，需按权值选择 Dijkstra 等算法。'],
      trap: '出队才标记，导致同一节点被大量重复加入。',
      check: ['无权图 BFS 第一次到达某点代表？', ['字典序最小', '边数最少', '权值最大', '随机路径'], 1, 'BFS 按步数分层扩展。']
    },
    {
      match: /深度优先|DFS|回溯|剪枝|基础搜索/,
      core: '深度优先沿一条选择走到底；回溯在返回时撤销选择，剪枝提前排除不可能成功的分支。',
      rule: '状态必须包含“走到哪、已选什么、还剩什么”；做选择与撤销选择要成对出现。',
      example: ['从 n 个数选 k 个', '输出所有严格递增的下标组合。', '递归参数 pos、还需选择数量，循环从 start 开始。'],
      code: `#include <bits/stdc++.h>
using namespace std;int n,k;vector<int>path;
void dfs(int start){if((int)path.size()==k){for(int x:path)cout<<x<<" ";cout<<"\\n";return;}for(int x=start;x<=n;x++){path.push_back(x);dfs(x+1);path.pop_back();}}
int main(){cin>>n>>k;dfs(1);}`,
      practice: ['n 皇后中哪些冲突可立即剪枝？', '为什么回溯后必须恢复 visited？'],
      answer: ['同列、主对角线、副对角线冲突。', '否则其他分支会错误继承本分支选择。'],
      trap: '只做选择不撤销，或把全局最优剪枝条件写反。',
      check: ['回溯的核心动作是？', ['排序后退出', '选择、递归、撤销选择', '只做循环', '复制答案'], 1, '撤销让后续分支从正确状态开始。']
    },
    {
      match: /树|二叉树|哈夫曼/,
      core: '树是连通无环的层次结构，n 个结点有 n-1 条边；遍历顺序决定何时处理根。',
      rule: '递归函数先写清“处理哪棵子树、返回什么”；空结点是统一终止条件。',
      example: ['二叉树高度', '空树高度 0，非空树为左右高度最大值加 1。', '后序计算：先得到两棵子树结果，再合成本结点。'],
      code: `#include <bits/stdc++.h>
using namespace std;struct Node{int l=-1,r=-1;};vector<Node>t;
int height(int u){if(u<0)return 0;return 1+max(height(t[u].l),height(t[u].r));}
int main(){int n;cin>>n;t.resize(n);for(auto&x:t)cin>>x.l>>x.r;cout<<height(0)<<"\\n";}`,
      practice: ['写出前序、中序、后序的根访问位置。', '完全二叉树与满二叉树有什么区别？'],
      answer: ['前序根左右，中序左根右，后序左右根。', '完全二叉树最后一层可不满但靠左；满二叉树每层都满。'],
      trap: '题目未说明高度从 0 还是 1 开始就直接套结论。',
      check: ['n 个结点的树有多少条边？', ['n', 'n-1', 'n+1', '2n'], 1, '树连通且无环，边数恒为 n-1。']
    },
    {
      match: /堆|优先队列/,
      core: '优先队列每次取当前最大或最小元素，适合动态维护“最急的一项”。',
      rule: '先确认要大根堆还是小根堆；元素是结构体时明确优先级和相等规则。',
      example: ['合并果子', '每次合并最轻的两堆，使总代价最小。', '把所有重量放入小根堆，每次取两个最小值。'],
      code: cpp('int n;cin>>n;priority_queue<long long,vector<long long>,greater<long long>>q;\nwhile(n--){long long x;cin>>x;q.push(x);}long long ans=0;\nwhile(q.size()>1){auto a=q.top();q.pop();auto b=q.top();q.pop();ans+=a+b;q.push(a+b);}\ncout<<ans<<"\\n";'),
      practice: ['维护数据流中最大的 k 个数应选什么堆？', '为什么合并果子先取最小两堆？'],
      answer: ['可用大小为 k 的小根堆保存当前最大 k 个。', '小重量越早被重复计入，交换论证可证明总代价不更大。'],
      trap: '默认 priority_queue 是大根堆，却按小根堆理解。',
      check: ['C++ 默认 priority_queue.top() 返回？', ['最小值', '最大值', '最早插入值', '随机值'], 1, '默认是大根堆。']
    },
    {
      match: /并查集/,
      core: '并查集维护元素属于哪个连通集合，支持快速合并与查询；路径压缩让树变扁。',
      rule: 'find 返回代表元，merge 只连接两个代表元；不要直接把普通节点互连。',
      example: ['朋友关系', '不断加入朋友关系，询问两人是否在同一圈。', '每条关系 merge，询问时比较 find。'],
      code: `#include <bits/stdc++.h>
using namespace std;vector<int>p;
int find(int x){return p[x]==x?x:p[x]=find(p[x]);}
int main(){int n,m;cin>>n>>m;p.resize(n+1);iota(p.begin(),p.end(),0);while(m--){int a,b;cin>>a>>b;a=find(a);b=find(b);if(a!=b)p[a]=b;}int x,y;cin>>x>>y;cout<<(find(x)==find(y)?"YES":"NO")<<"\\n";}`,
      practice: ['路径压缩做了什么？', '并查集能直接给出两点最短路径吗？'],
      answer: ['让访问过的节点直接连到代表元。', '不能，它只维护连通性，不保存路径长度。'],
      trap: '合并 a、b 本身而不是它们的代表元，破坏集合结构。',
      check: ['并查集最擅长维护什么？', ['字符串匹配', '动态连通集合', '浮点精度', '文件格式'], 1, '核心操作是集合合并与同集合查询。']
    },
    {
      match: /动态规划|DP|背包|线性动态|区间动态|递推/,
      core: '动态规划把重复子问题的答案保存下来；状态、转移、初值和计算顺序缺一不可。',
      rule: '先用一句话定义 dp 状态，再枚举最后一步来自哪里；确认依赖已计算且没有后效性。',
      example: ['0/1 背包', '每件物品最多选一次，容量 W，价值最大。', 'dp[j] 是容量 j 的最大价值；容量倒序避免同一物品重复使用。'],
      code: cpp('int n,W;cin>>n>>W;vector<int>dp(W+1);\nfor(int i=0,w,v;i<n;i++){cin>>w>>v;for(int j=W;j>=w;j--)dp[j]=max(dp[j],dp[j-w]+v);}\ncout<<dp[W]<<"\\n";'),
      practice: ['完全背包容量为什么正序？', '写出爬楼梯 dp[i] 的状态与转移。'],
      answer: ['允许当前物品在本轮再次被使用。', 'dp[i] 表示到第 i 阶方案数，dp[i]=dp[i-1]+dp[i-2]。'],
      trap: '先抄模板再猜状态含义，或 0/1 背包把容量方向写反。',
      check: ['0/1 背包一维优化时容量通常怎样枚举？', ['从小到大', '从大到小', '随机', '只枚举偶数'], 1, '倒序保证每件物品本轮最多使用一次。']
    },
    {
      match: /状态压缩/,
      core: '状态压缩用一个整数的二进制位表示一组开关，适合元素数量较小的集合状态。',
      rule: '先给每一位固定含义；判断、加入、删除元素分别使用 &、|、&~。',
      example: ['课程选择集合', '第 i 位表示课程 i 是否已选。', 'mask&(1<<i) 判断，mask|=1<<i 加入。'],
      code: cpp('int mask=0,i;cin>>i;mask|=1<<i;\ncout<<((mask&(1<<i))?"YES":"NO")<<"\\n";'),
      practice: ['怎样删除第 i 位元素？', 'n=25 时遍历全部子集约多少个状态？'],
      answer: ['mask &= ~(1<<i)。', '2^25，约 3355 万，需要结合转移复杂度评估。'],
      trap: '移位优先级和括号写错，或 n 太大仍强行枚举 2^n。',
      check: ['把第 i 位设为 1 使用？', ['mask & (1<<i)', 'mask | (1<<i)', 'mask ^ 0', 'mask / i'], 1, '按位或会保留其他位并把目标位置 1。']
    },
    {
      match: /图的存储|图模型|图的定义|图的遍历/,
      core: '图用顶点与边描述一般关系；建图前要确认有向/无向、带权/无权和编号范围。',
      rule: '稀疏图优先邻接表；无向边要加入两个方向，访问时维护 visited 防止绕环。',
      example: ['城市连通图', '读入 n 个点 m 条无向边，输出每点度数。', '邻接表中每条无向边加入两次。'],
      code: cpp('int n,m;cin>>n>>m;vector<vector<int>>g(n+1);\nwhile(m--){int u,v;cin>>u>>v;g[u].push_back(v);g[v].push_back(u);}\nfor(int i=1;i<=n;i++)cout<<g[i].size()<<"\\n";'),
      practice: ['有向图入度和出度怎样统计？', '邻接矩阵适合哪类图？'],
      answer: ['u→v 时 out[u]++、in[v]++。', '点数较小或边很稠密、需要 O(1) 查边时。'],
      trap: '无向边只存一个方向，或顶点从 1 编号却数组只开 n。',
      check: ['稀疏图常用什么存储？', ['邻接表', '完整 n×n 字符图', '栈', '字符串'], 0, '邻接表空间约 O(n+m)。']
    },
    {
      match: /最短路/,
      core: '最短路算法取决于边权：无权图用 BFS，非负权常用 Dijkstra，存在负权需换算法。',
      rule: 'dist 表示当前已知最短距离；每次松弛检查经过 u 到 v 是否更短。',
      example: ['非负权单源最短路', '从 1 号点到所有点最短距离。', '小根堆每次取当前距离最小的未过期状态。'],
      code: `#include <bits/stdc++.h>
using namespace std;int main(){int n,m;cin>>n>>m;vector<vector<pair<int,int>>>g(n+1);while(m--){int u,v,w;cin>>u>>v>>w;g[u].push_back({v,w});}const long long INF=4e18;vector<long long>d(n+1,INF);priority_queue<pair<long long,int>,vector<pair<long long,int>>,greater<pair<long long,int>>>q;d[1]=0;q.push({0,1});while(!q.empty()){auto[du,u]=q.top();q.pop();if(du!=d[u])continue;for(auto[v,w]:g[u])if(d[v]>du+w){d[v]=du+w;q.push({d[v],v});}}for(int i=1;i<=n;i++)cout<<d[i]<<" ";}`,
      practice: ['为什么 Dijkstra 不能直接处理负边？', '不可达点应怎样表示？'],
      answer: ['已确定的最短点可能被后续负边再次改善，贪心前提失效。', '用 INF 保存并在输出时按题意转换。'],
      trap: '边权相加时用 int 溢出，或没跳过堆中过期状态。',
      check: ['所有边权非负时常用哪种单源最短路？', ['Dijkstra', '冒泡排序', '并查集', '前缀和'], 0, 'Dijkstra 依赖非负边权的贪心性质。']
    },
    {
      match: /最小生成树/,
      core: '最小生成树用 n-1 条边连通全部顶点且总权最小，不要求任意两点路径都最短。',
      rule: 'Kruskal 按边权升序，只有连接不同连通块时才选；并查集负责判环。',
      example: ['最低布线成本', '连接所有站点，边有成本。', '从便宜边开始选，若形成环就跳过。'],
      code: cpp('cout << "按边权排序；若 find(u)!=find(v)，选边并合并集合。\\n";'),
      practice: ['连通图的生成树有多少条边？', '最短路树一定是最小生成树吗？'],
      answer: ['n-1。', '不一定，目标分别是源点距离最短与总边权最小。'],
      trap: '把最小生成树与单源最短路混为一谈。',
      check: ['n 个点的生成树有多少条边？', ['n-2', 'n-1', 'n', '2n'], 1, '树的边数恒为点数减一。']
    },
    {
      match: /拓扑排序/,
      core: '拓扑序把有向无环图排成先修关系，所有边都从前指向后。',
      rule: '把入度为 0 的点入队；删除它的出边后，新入度为 0 的点继续入队。',
      example: ['课程先修', '若 A 必须在 B 前，输出一种合法学习顺序。', '边 A→B，入度为 0 的课当前可学。'],
      code: cpp('cout << "统计入度；队列反复取入度为0的点并删除出边。\\n";'),
      practice: ['输出点数少于 n 说明什么？', '多个入度 0 点如何得到字典序最小序列？'],
      answer: ['图中存在有向环。', '使用小根优先队列。'],
      trap: '把边方向写反，或没用输出数量检查环。',
      check: ['拓扑排序适用于？', ['任意无向图', '有向无环图', '只有树', '带负权图'], 1, '有向环不存在满足所有先后关系的线性序。']
    },
    {
      match: /哈希|去重/,
      core: '哈希把键映射到桶，平均可快速查询与计数；最坏性能和冲突仍需认识。',
      rule: '只关心存在性用 set，只关心频次用 map/unordered_map；自定义对象需定义相等与哈希。',
      example: ['词频统计', '输入 n 个单词，输出每个单词出现次数。', 'unordered_map<string,int> 按单词累加。'],
      code: cpp('int n;cin>>n;unordered_map<string,int>cnt;\nwhile(n--){string s;cin>>s;cnt[s]++;}\nstring q;cin>>q;cout<<cnt[q]<<"\\n";'),
      practice: ['数组值范围很小为什么可直接计数？', 'unordered_map 与 map 的主要差别？'],
      answer: ['值可直接作为下标，避免哈希开销。', '前者平均 O(1) 无序，后者 O(log n) 且按键有序。'],
      trap: '需要有序输出却使用 unordered_map 后直接遍历。',
      check: ['只判断元素是否出现，最直接的容器是？', ['set', 'queue', 'stack', 'string'], 0, '集合表达不重复元素的存在性。']
    },
    {
      match: /最大公约数|欧几里得|质数|筛|约数|倍数|唯一分解|初等数论/,
      core: '数论问题先利用整除结构缩小枚举；欧几里得算法求最大公约数，筛法批量求质数。',
      rule: '单个质数判定试除到 sqrt(n)；批量查询用筛法；分解质因数时同一因子要除尽。',
      example: ['最大公约数', '求 84 与 30 的 gcd。', '反复用 (a,b)←(b,a%b)，最终得到 6。'],
      code: cpp('long long a,b;cin>>a>>b;\nwhile(b){long long r=a%b;a=b;b=r;}\ncout<<a<<"\\n";'),
      practice: ['最小公倍数怎样由 gcd 得到？', '埃氏筛为什么从 p² 开始标记？'],
      answer: ['lcm=a/gcd(a,b)*b，先除可降低溢出。', '更小倍数已被更小质因子标过。'],
      trap: '计算 lcm 时先乘后除导致溢出，或把 1 当质数。',
      check: ['质数的定义要求大于？', ['0', '1', '2', '10'], 1, '质数是大于 1 且只有 1 和自身两个正因数的整数。']
    },
    {
      match: /高精度/,
      core: '当整数超出内置类型范围时，可用数组按位或按块存储并模拟竖式运算。',
      rule: '统一低位在前，逐位计算并维护进位；输出时跳过最高前导零但保留数字 0。',
      example: ['高精度加法', '计算两个上百位非负整数之和。', '从末位向前逐位相加，sum%10 写当前位，sum/10 进位。'],
      code: cpp('string a,b;cin>>a>>b;reverse(a.begin(),a.end());reverse(b.begin(),b.end());\nvector<int>c(max(a.size(),b.size())+1);for(size_t i=0;i<c.size()-1;i++){if(i<a.size())c[i]+=a[i]-\'0\';if(i<b.size())c[i]+=b[i]-\'0\';c[i+1]+=c[i]/10;c[i]%=10;}int i=c.size()-1;while(i>0&&c[i]==0)i--;for(;i>=0;i--)cout<<c[i];cout<<"\\n";'),
      practice: ['高精度减法为什么要先比较大小？', '按 10^9 分块的好处是什么？'],
      answer: ['决定符号并保证逐位借位处理一致。', '每个块保存更多十进制位，循环次数更少。'],
      trap: '低位顺序不统一，或最高位的最终进位丢失。',
      check: ['高精度加法每位最重要的额外状态是？', ['颜色', '进位', '文件名', '递归深度'], 1, '竖式加法必须把进位带到下一位。']
    },
    {
      match: /原码|反码|补码|进制|位运算|二进制|十六进制/,
      core: '进制数按位权展开；补码统一有符号整数的加减运算；位运算直接操作二进制位。',
      rule: '转换时先确认位数与有无符号；二进制与十六进制可每 4 位一组互转。',
      example: ['二进制转十进制', '101101₂ 等于多少？', '32+8+4+1=45。'],
      code: cpp('string s;cin>>s;long long x=0;\nfor(char c:s)x=x*2+(c-\'0\');\ncout<<x<<"\\n";'),
      practice: ['十六进制 2F 转十进制。', '判断 x 的第 k 位是否为 1。'],
      answer: ['2×16+15=47。', '(x>>k)&1。'],
      trap: '没先确定固定位数就讨论负数补码，或把 bit 与 Byte 混用。',
      check: ['1 Byte 等于多少 bit？', ['1', '4', '8', '1024'], 2, '1 字节等于 8 位。']
    },
    {
      match: /流程图|算法的概念|自然语言|伪代码|程序设计语言/,
      core: '算法是有限、明确、可执行的步骤；自然语言、流程图和伪代码只是不同表达载体。',
      rule: '先写输入、输出、状态和终止条件，再选择表达方式；任何一步都不能依赖含糊判断。',
      example: ['找三个数最大值', '用伪代码描述。', 'ans←a；若 b>ans 则更新；若 c>ans 则更新；输出 ans。'],
      code: cpp('int a,b,c;cin>>a>>b>>c;cout<<max(a,max(b,c))<<"\\n";'),
      practice: ['为“判断闰年”画分支流程。', '说明算法为什么必须终止。'],
      answer: ['能被400整除，或能被4整除且不能被100整除。', '无限步骤不能在有限时间给出结果。'],
      trap: '流程图看似完整，却没有循环推进或输出出口。',
      check: ['算法的必要性质之一是？', ['步骤含糊', '有限终止', '必须使用 C++', '必须有图形界面'], 1, '算法要在有限步骤内给出结果。']
    },
    {
      match: /存储|网络|操作系统|计算机|CPU|安全/,
      core: 'CPU 执行指令，内存保存运行中数据，外存长期保存；网络协议约定通信规则。',
      rule: '按“谁负责什么”理解概念，不只背缩写；安全问题区分备份、权限、加密和校验。',
      example: ['打开网页', '从输入域名到看到页面发生什么？', 'DNS 解析地址→建立连接→传输→浏览器解析→屏幕显示。'],
      code: cpp('cout<<"CPU + memory + storage + network\\n";'),
      practice: ['解释内存与硬盘差别。', '备份和加密能否互相替代？'],
      answer: ['内存快、服务运行数据且通常断电丢失；硬盘长期保存。', '不能，备份防丢失，加密防未授权读取。'],
      trap: '把浏览器当操作系统，或把域名当 IP 地址。',
      check: ['断电后通常仍保存数据的是？', ['寄存器', '内存', '固态硬盘', '高速缓存'], 2, '固态硬盘属于外存。']
    },
    {
      match: /数学函数|平方根|绝对值|三角|对数|指数/,
      core: '数学库函数有输入范围、返回类型和精度误差；使用前先确认定义域。',
      rule: '整数问题能用整数运算就不用浮点近似；sqrt、log 等结果比较使用容差。',
      example: ['两点距离', '计算 (x1,y1) 与 (x2,y2) 的欧氏距离。', 'sqrt((x1-x2)²+(y1-y2)²)。'],
      code: cpp('double x1,y1,x2,y2;cin>>x1>>y1>>x2>>y2;\ncout<<fixed<<setprecision(3)<<hypot(x1-x2,y1-y2)<<"\\n";'),
      practice: ['abs、min、max 分别解决什么？', '为什么 sqrt(n) 后强转 int 要复核平方？'],
      answer: ['绝对值、最小值、最大值。', '浮点近似可能在整数边界产生误差。'],
      trap: '直接比较两个浮点计算结果完全相等。',
      check: ['浮点结果比较更稳妥的方式是？', ['直接 ==', '比较差的绝对值是否小于容差', '转字符串', '忽略结果'], 1, '容差比较能容纳表示误差。']
    },
    {
      match: /计数原理|排列|组合|杨辉/,
      core: '加法原理处理互斥选择，乘法原理处理连续步骤；排列看顺序，组合不看顺序。',
      rule: '先问是否有顺序、是否允许重复，再选公式；组合数可用杨辉递推避免阶乘溢出。',
      example: ['选队员', '5 人中选 2 人，不分顺序。', 'C(5,2)=10；若分队长和队员则是 5×4=20。'],
      code: cpp('int n;cin>>n;vector<vector<long long>>C(n+1,vector<long long>(n+1));\nfor(int i=0;i<=n;i++){C[i][0]=C[i][i]=1;for(int j=1;j<i;j++)C[i][j]=C[i-1][j-1]+C[i-1][j];}\ncout<<C[n][2]<<"\\n";'),
      practice: ['3 件上衣、4 条裤子有多少搭配？', '解释 C(n,k)=C(n-1,k-1)+C(n-1,k)。'],
      answer: ['3×4=12。', '按是否选择某个固定元素分类。'],
      trap: '没判断顺序是否重要就直接套排列或组合公式。',
      check: ['从 5 人中选 2 人且不分顺序，共几种？', ['5', '10', '20', '25'], 1, 'C(5,2)=10。']
    },
    {
      match: /倍增/,
      core: '倍增预处理 2^k 步后的结果，把长距离跳转拆成二进制位，查询降为 O(log n)。',
      rule: '表 up[k][v] 表示从 v 跳 2^k 步；转移为 up[k][v]=up[k-1][up[k-1][v]]。',
      example: ['第 k 个祖先', '多次询问节点向上 k 步是谁。', '按 k 的二进制位，从低到高执行对应跳跃。'],
      code: cpp('cout<<"把 k 写成二进制，逐位使用 1,2,4,8... 步跳表。\\n";'),
      practice: ['为什么预处理层数约 log n？', '若中途跳到 0 应怎样处理？'],
      answer: ['最大需要覆盖到不超过 n 的最高二进制位。', '后续仍保持 0，避免越界。'],
      trap: '数组层数少一层，或跳表转移时访问无效祖先。',
      check: ['倍增把一次 k 步跳转降到什么量级？', ['O(1) 永远', 'O(log k)', 'O(k²)', 'O(2^k)'], 1, '按 k 的二进制位最多处理 log k 位。']
    },
    {
      match: /几何|坐标/,
      core: '计算几何先把图形关系转为向量、距离或叉积；整数坐标尽量用整数避免精度问题。',
      rule: '方向判断用叉积符号，距离比较可比较平方而不必开方。',
      example: ['点在直线哪侧', '判断点 P 相对有向线 AB 的方向。', '计算 (B-A)×(P-A)，正左、负右、零共线。'],
      code: cpp('long long ax,ay,bx,by,px,py;cin>>ax>>ay>>bx>>by>>px>>py;\nlong long cross=(bx-ax)*(py-ay)-(by-ay)*(px-ax);\ncout<<(cross>0?"LEFT":cross<0?"RIGHT":"ON")<<"\\n";'),
      practice: ['比较两段距离为何可不 sqrt？', '叉积为 0 只说明什么？'],
      answer: ['平方根单调，比较平方结果即可。', '三点共线，不自动说明点在线段内。'],
      trap: '用 int 计算坐标乘积溢出，或把共线误判为在线段上。',
      check: ['叉积为 0 通常说明三点？', ['共线', '等距', '成直角', '重合'], 0, '二维叉积为 0 表示方向向量平行。']
    },
    {
      match: /文件|重定向|异常/,
      core: '文件输入输出让程序处理持久数据；异常和输入失败必须显式检查，不能默默继续。',
      rule: '打开文件后先判断状态；算法逻辑与输入来源分离，便于用标准输入和文件分别测试。',
      example: ['读取成绩文件', '逐行读取姓名和成绩，统计平均值。', '若文件打不开，立即报告并退出。'],
      code: `#include <bits/stdc++.h>
using namespace std;int main(){ifstream fin("score.txt");if(!fin){cerr<<"open failed\\n";return 1;}string name;int score,sum=0,n=0;while(fin>>name>>score){sum+=score;n++;}if(n)cout<<(double)sum/n<<"\\n";}`,
      practice: ['为什么 while(!fin.eof()) 常写错？', '输出文件覆盖与追加有什么区别？'],
      answer: ['eof 只有读失败后才置位，容易多处理一次旧数据；应以读取表达式为条件。', '覆盖清空旧内容，追加写到末尾。'],
      trap: '不检查文件是否成功打开，失败后仍用空数据计算。',
      check: ['读取文件循环更稳妥的条件是？', ['while(!eof())', 'while(fin>>x)', '无限循环', '只读一次'], 1, '读取表达式同时完成读取并报告是否成功。']
    },
    {
      match: /边界|调试|反例|验证|建模|阶段测评|模拟测评|考前/,
      core: '完成不是“样例过了”，而是正常、边界、反例和规模四类证据都站得住。',
      rule: '先写最小复现；一次只改一个原因；测最小值、临界值、最大值、重复值与无解情况。',
      example: ['查找差一位错误', '程序在 n=1 时越界。', '画合法下标表，检查循环首尾与初始化。'],
      code: cpp('int n;cin>>n;vector<int>a(n);\n// 验收：n=1、全相等、全负数、最大规模\nfor(int&i:a)cin>>i;\ncout<<(a.empty()?0:*max_element(a.begin(),a.end()))<<"\\n";'),
      practice: ['为二分查找列出四个边界样例。', '解释为什么随机测试不能替代针对性反例。'],
      answer: ['空/单元素、目标在首尾、目标不存在、重复值边界。', '随机数据可能长期碰不到特定分支与临界状态。'],
      trap: '连续改多处后结果好了，却不知道真正原因。',
      check: ['哪项最能证明学会？', ['刚看过讲义', '独立做出新题并解释边界', '背下代码', '样例看懂'], 1, '迁移和边界解释比熟悉感更能证明掌握。']
    }
  ];

  const fallback = {
    core: '先把题目中的对象、状态、操作和目标翻译成清晰模型，再决定数据结构与算法。',
    rule: '用最小样例手算一遍，写出不变量和边界，最后再编码。',
    example: ['最小建模练习', '把输入、处理、输出分别写成一句话。', '模型清楚后再选择实现工具。'],
    code: cpp('cout << "先建模，再编码，再验证" << \'\\n\';'),
    practice: ['写出本课概念解决的问题。', '设计一个能击穿错误理解的反例。'],
    answer: ['答案必须包含输入、状态和目标。', '反例应尽量小，并只触发一个错误原因。'],
    trap: '直接复制模板，无法解释每个状态的含义。',
    check: ['解决新题第一步应是？', ['复制代码', '明确输入、状态与目标', '猜复杂度', '只看答案'], 1, '建模决定后续算法和实现。']
  };

  const regular = [
    ['regular-l1', 'L1', 'C++ 编程启蒙', [
      '程序、编译与运行','第一条输出语句','变量与常量','整数和浮点数','键盘输入','算术运算',
      '表达式优先级','整除与取余','数据类型选择','字符与字符串初识','顺序结构建模','交换两个变量',
      '时间与单位换算','坐标和距离计算','边界样例与调试','L1 阶段测评'
    ]],
    ['regular-l2', 'L2', '控制结构与基础算法', [
      '布尔值与比较运算','单分支 if','双分支 if-else','多分支判断','条件的与或非','for 循环',
      'while 循环','循环计数与累加','循环中的最大最小值','嵌套循环','函数的定义与调用','参数与返回值',
      '一维数组','数组遍历与统计','字符串逐字符处理','选择排序','冒泡排序','顺序查找','简单模拟','L2 阶段测评'
    ]],
    ['regular-l3', 'L3', '算法与数据结构入门', [
      '复杂度与数据规模','快速排序思想','二分查找','前缀和','差分思想','递归与调用栈','贪心选择',
      '栈的应用','队列的应用','链式关系初识','树与二叉树','堆与优先队列','并查集','基础搜索','综合算法建模','L3 阶段测评'
    ]],
    ['regular-l4', 'L4', '竞赛算法进阶', [
      '深度优先搜索','广度优先搜索','回溯与剪枝','状态压缩入门','动态规划的状态','线性动态规划',
      '背包问题','区间动态规划初识','图的存储','图的遍历','最短路入门','最小生成树初识',
      '拓扑排序','并查集进阶','字符串匹配与哈希','初等数论','综合题时间分配','L4 阶段测评'
    ]]
  ];

  const gesp = [
    ['gesp-1', '一级', 'C++ 程序基础', ['计算机与开发环境','程序与编译','变量、常量与数据类型','输入与输出','算术、关系与逻辑运算','顺序与分支结构','循环结构','1级模拟测评']],
    ['gesp-2', '二级', '结构化程序设计', ['计算机存储与网络','程序设计语言与流程图','ASCII 与类型转换','多层分支结构','多层循环结构','常用数学函数','分支循环综合应用','2级模拟测评']],
    ['gesp-3', '三级', '编码、数组与基础算法', ['原码、反码与补码','二八十六进制转换','位运算','算法的自然语言、流程图与伪代码描述','一维数组','字符串及常用函数','枚举法','模拟法','数组字符串综合','3级模拟测评']],
    ['gesp-4', '四级', '函数、结构体与递推排序', ['函数定义、调用与作用域','值、引用与指针参数传递','指针基础','结构体','二维与多维数组','递推关系','基础排序与稳定性','简单复杂度估算','文件读写与异常处理','4级模拟测评']],
    ['gesp-5', '五级', '数论、线性表与算法策略', ['初等数论','高精度四则运算','链表结构','欧几里得算法','埃氏筛与线性筛','唯一分解与约数','二分查找与二分答案','贪心算法','分治、归并、快排与递归','5级模拟测评']],
    ['gesp-6', '六级', '树、搜索与基础动态规划', ['树的定义、构造与遍历','哈夫曼树、完全二叉树与二叉排序树','深度优先搜索','广度优先搜索','二叉树搜索','一维动态规划','简单背包问题','面向对象与类','栈、队列与循环队列','6级模拟测评']],
    ['gesp-7', '七级', '图与复杂动态规划', ['三角、对数与指数函数','二维动态规划','动态规划最值优化','图的定义与存储','图的深度优先遍历','图的广度优先遍历','泛洪算法','哈希表','图与动态规划综合','7级模拟测评']],
    ['gesp-8', '八级', '组合数学与图论优化', ['计数原理','排列与组合','杨辉三角','倍增法','初中代数与平面几何','单源最短路','最小生成树','算法空间与时间效率分析','综合算法优化','8级模拟测评']]
  ];

  function pickProfile(title) {
    return profiles.find(profile => profile.match.test(title)) || fallback;
  }

  function makeLesson(course, index, title) {
    const p = pickProfile(title);
    const id = `${course.id}-${String(index + 1).padStart(2, '0')}`;
    const memory = [
      { id: `${id}-m1`, tag: '核心', prompt: `“${title}”解决什么问题？`, answer: p.core },
      { id: `${id}-m2`, tag: '方法', prompt: `完成“${title}”时最稳的步骤是什么？`, answer: p.rule },
      { id: `${id}-m3`, tag: '避坑', prompt: `这节课最容易出现什么错误？`, answer: p.trap }
    ];
    const quiz = [
      { id: `${id}-q1`, stem: p.check[0], options: p.check[1], answer: p.check[2], explanation: p.check[3] },
      { id: `${id}-q2`, stem: `学习“${title}”时，哪种做法最可靠？`, options: ['直接背参考代码', p.rule, '只跑给定样例', '跳过边界检查'], answer: 1, explanation: p.rule },
      { id: `${id}-q3`, stem: `下面哪项是“${title}”的高频错误？`, options: ['先写输入输出', '先手算最小样例', p.trap, '记录变量含义'], answer: 2, explanation: p.trap },
      { id: `${id}-q4`, stem: '哪种表现可以计为本课真正掌握？', options: ['看完讲义', '觉得示例很熟', '独立完成迁移题并解释边界', '抄完代码'], answer: 2, explanation: '掌握要能独立提取、迁移和验证，熟悉感不能代替会做。' }
    ];
    return {
      id, courseId: course.id, track: course.track, order: index + 1, title, duration: 120,
      goal: `能解释${title}的核心规则，独立完成一道同类题，并用边界样例验证结果。`,
      schedule,
      concepts: [
        ['核心模型', p.core],
        ['解题流程', p.rule],
        ['完成标准', `不看讲义写出关键步骤，完成“${p.example[0]}”同类题，并说清一个边界和一个反例。`]
      ],
      example: {
        title: p.example[0],
        statement: p.example[1],
        answer: p.example[2],
        steps: [p.rule, p.example[2], `用最小值、临界值和特殊值复核“${title}”。`],
        code: p.code
      },
      practices: [
        { level: '跟做', task: p.practice[0], answer: p.answer[0] },
        { level: '独立', task: p.practice[1], answer: p.answer[1] },
        { level: '迁移', task: `不用复制示例，自己设计一道使用“${title}”的生活或竞赛小题，写出输入、输出、算法和至少两个边界样例。`, answer: `合格答案必须有明确数据范围、可执行步骤、正常样例和能触发边界的样例。` }
      ],
      traps: [p.trap, '只通过示例输入就停止，没有覆盖临界值与无解情况。'],
      memory, quiz, published: true
    };
  }

  function makeCourses(rows, track) {
    return rows.map(([id, level, title, titles], courseIndex) => {
      const course = { id, level, title, track, order: courseIndex + 1 };
      course.lessons = titles.map((lessonTitle, index) => makeLesson(course, index, lessonTitle));
      course.units = [
        { title: '建立模型', lessons: course.lessons.slice(0, Math.ceil(course.lessons.length / 2)) },
        { title: '应用与闯关', lessons: course.lessons.slice(Math.ceil(course.lessons.length / 2)) }
      ];
      course.description = track === 'regular'
        ? `${level} 常规课共 ${course.lessons.length} 节，从概念、代码、练习到测验完整闭环。`
        : `${level}共 ${course.lessons.length} 节，按 CCF GESP C++ 现行认证标准重新编排。`;
      return course;
    });
  }

  const courses = [...makeCourses(regular, 'regular'), ...makeCourses(gesp, 'gesp')];
  window.COURSE_CATALOG = {
    version: '2026.07.28-full-v1',
    sources: {
      noi: 'https://noi.ccf.org.cn/cbw/2025-04-18/841594.shtml',
      gesp: 'https://gesp.ccf.org.cn/101/1008/10012.html',
      gespRevision: 'https://gesp.ccf.org.cn/101/1002/10255.html'
    },
    courses,
    lessons: courses.flatMap(course => course.lessons)
  };
})();
