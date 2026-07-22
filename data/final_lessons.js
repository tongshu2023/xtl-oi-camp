(function () {
  const lesson = (id, title, goal, concepts, example, traps, teacherTips) => ({
    id, title, goal, concepts, example, traps, teacherTips
  });

  window.FINAL_LESSONS = {
    S1: {
      id: 'S1',
      title: '模拟与枚举',
      lessons: [
        lesson('S1-1', '建立模型：把规则翻译成状态变化',
          '读完规则后，能找出会变化的量，并按事件发生顺序写出一遍不漏的模拟程序。',
          [
            ['状态（程序此刻要记住的信息）', '机器人走路时，只要记住横坐标和纵坐标；不要把整张地图都搬进程序。'],
            ['事件（让状态发生变化的一步）', '每读到一个方向字母，就让坐标只变化一次，这个字母就是一个事件。'],
            ['初始化（开始前的状态）', '题目说从原点出发，就先把 x 和 y 都设为 0，再处理命令。'],
            ['顺序模拟', '题目怎样一步一步发生，代码就照着怎样一步一步执行。']
          ],
          {
            title: '机器人走方格',
            statement: '机器人从 (0,0) 出发，读入一串只含 U、D、L、R 的命令，输出执行完后的坐标。',
            steps: ['用 x、y 记录当前位置。', '逐个读取字符，按方向修改一个坐标。', '所有命令处理完后输出 x 和 y。'],
            code: `#include <iostream>\n#include <string>\n+using namespace std;\n+int main() {\n+    string s;\n+    cin >> s;\n+    int x = 0, y = 0; // 初始位置\n+    for (char c : s) {\n+        if (c == 'U') y++;\n+        else if (c == 'D') y--;\n+        else if (c == 'L') x--;\n+        else if (c == 'R') x++;\n+    }\n+    cout << x << ' ' << y << '\\n';\n+    return 0;\n+}`,
            walkthrough: ['输入 URRDD 时，前两个字符把位置变成 (1,1)。', '接着两个 R 把 x 加到 3，D 再把 y 减到 0。', '最终输出 3 0；每条命令只执行一次。']
          },
          ['把 U、D 对 y 的影响写反。', '循环从第二个字符开始，漏掉第一条命令。', '每轮重新把 x、y 设为 0。'],
          ['展示 ULRD，让学生先用手走一遍再写代码。', '写四个分支前追问：每条命令到底只改哪一个量？']
        ),
        lesson('S1-2', '例题拆解：枚举所有可能再筛选',
          '面对范围不大的未知答案，能先估算候选数量，再完整枚举并检查条件。',
          [
            ['枚举（把所有候选逐个试一遍）', '候选只有 900 个三位数时，逐个检查比硬想公式更稳。'],
            ['候选范围', '先写清最小可能值和最大可能值，循环边界才不会漏。'],
            ['判定条件', '把题目要求拆成几个真假问题，全部满足才保留候选。'],
            ['复杂度（程序大概要做多少步）', '900 个数每个看 3 位，只有几千步，比赛中完全跑得动。']
          ],
          {
            title: '寻找幸运密码',
            statement: '输出所有三位数：三个数位互不相同，并且三个数位之和等于给定的 s。',
            steps: ['枚举 100 到 999 的每个数。', '拆出百位、十位和个位。', '同时检查数位和与互不相同两个条件。'],
            code: `#include <iostream>\n+using namespace std;\n+int main() {\n+    int s;\n+    cin >> s;\n+    for (int n = 100; n <= 999; n++) {\n+        int a = n / 100;\n+        int b = n / 10 % 10;\n+        int c = n % 10;\n+        bool different = a != b && a != c && b != c;\n+        if (a + b + c == s && different)\n+            cout << n << '\\n';\n+    }\n+    return 0;\n+}`,
            walkthrough: ['n=123 时，a=1、b=2、c=3。', '三个数位之和为 6，且两两不同，所以 s=6 时输出它。', 'n=114 虽然数位和也是 6，但有两个 1，要被筛掉。']
          },
          ['百位从 0 开始，枚举出了两位数。', '只检查 a!=b 和 b!=c，忘了 a!=c。', '拆十位时写成 n/10，得到的不是一位数字。'],
          ['先问学生三位数一共有多少个，判断暴力能不能做。', '给出 114，让学生先猜它会在哪个条件被淘汰。']
        ),
        lesson('S1-3', '混合训练：在枚举里完成小模拟',
          '能把“枚举对象”和“处理对象内部细节”分成两层循环，解决计数类混合题。',
          [
            ['外层枚举', '从 1 到 n 一个数一个数地看，保证没有遗漏。'],
            ['内层拆位', '对当前数字反复取个位、删个位，直到它变成 0。'],
            ['计数器', '每发现一次目标数字就加一，答案只记录出现次数。'],
            ['边界检查', '题目从 1 开始，所以不用单独处理整数 0 的写法。']
          ],
          {
            title: '数字出现次数',
            statement: '给定 n 和数字 x，统计 1 到 n 的十进制写法中，x 一共出现多少次。',
            steps: ['枚举每个整数 i。', '复制 i 到 t，避免拆位破坏外层循环变量。', '反复检查 t 的个位，命中 x 就累加。'],
            code: `#include <iostream>\n+using namespace std;\n+int main() {\n+    int n, x, answer = 0;\n+    cin >> n >> x;\n+    for (int i = 1; i <= n; i++) {\n+        int t = i; // 用副本拆位\n+        while (t > 0) {\n+            if (t % 10 == x) answer++;\n+            t /= 10;\n+        }\n+    }\n+    cout << answer << '\\n';\n+    return 0;\n+}`,
            walkthrough: ['n=11、x=1 时，先检查 1，得到 1 次。', '检查 10 时个位是 0、十位是 1，再加 1。', '检查 11 时两个数位都是 1，再加 2，答案为 4。']
          },
          ['直接修改 i，导致外层循环乱掉。', 'while 条件写成 t>=0，t 变成 0 后死循环。', '看到 11 只加一次，没有逐位检查。'],
          ['先让学生手算 1 到 11 中数字 1 的次数。', '写 int t=i 前停一下，追问为什么不能直接拆 i。']
        )
      ],
      exercises: [
        { luoguId: 'P1042', title: '乒乓球', year: 2003, source: 'NOIP 普及组', difficulty: '普及-', hint: '按 11 分制和 21 分制分别模拟一遍比分。' },
        { luoguId: 'P1086', title: '花生采摘', year: 2004, source: 'NOIP 普及组', difficulty: '普及', hint: '先按花生数排序，再检查来回时间是否够。' },
        { luoguId: 'P1980', title: '计数问题', year: 2013, source: 'NOIP 普及组', difficulty: '入门', hint: '枚举每个数，再逐位统计目标数字。' },
        { luoguId: 'P2669', title: '金币', year: 2015, source: 'NOIP 普及组', difficulty: '入门', hint: '把“连续几天领几枚”看成一段一段模拟。' },
        { luoguId: 'P5660', title: '数字游戏', year: 2019, source: 'CSP-J', difficulty: '入门', hint: '逐个字符统计 1 的数量。' },
        { luoguId: 'P7071', title: '优秀的拆分', year: 2020, source: 'CSP-J', difficulty: '普及-', hint: '从最大的 2 的幂开始尝试拆分。' }
      ]
    },

    S2: {
      id: 'S2',
      title: '排序与贪心',
      lessons: [
        lesson('S2-1', '建立模型：先排出处理顺序',
          '能判断题目是否需要重新安排顺序，并写出包含多个比较条件的排序规则。',
          [
            ['排序（按规则重新排队）', '排序不是只会从小到大；成绩题可能先比总分，再比语文，最后比学号。'],
            ['关键字（本轮拿来比较的字段）', '总分是第一关键字，只有总分相同才轮到第二关键字。'],
            ['比较函数', '它回答“甲是否应该排在乙前面”，每一种并列情况都要说清。'],
            ['结构体（把同一个人的多项信息绑在一起）', '学号、语文和总分必须一起移动，不能只排序分数数组。']
          ],
          {
            title: '三科成绩排名',
            statement: '按总分降序、数学降序、学号升序排列学生，输出全部学号。',
            steps: ['读入每个学生三科成绩并算总分。', '把学号、数学和总分放进同一个结构体。', '写清三层比较规则后调用 sort。'],
            code: `#include <algorithm>\n+#include <iostream>\n+#include <vector>\n+using namespace std;\n+struct Student { int id, math, total; };\n+bool before(const Student& a, const Student& b) {\n+    if (a.total != b.total) return a.total > b.total;\n+    if (a.math != b.math) return a.math > b.math;\n+    return a.id < b.id;\n+}\n+int main() {\n+    int n; cin >> n;\n+    vector<Student> a(n);\n+    for (int i = 0, x, y, z; i < n; i++) {\n+        cin >> x >> y >> z;\n+        a[i] = {i + 1, y, x + y + z};\n+    }\n+    sort(a.begin(), a.end(), before);\n+    for (auto s : a) cout << s.id << ' ';\n+    return 0;\n+}`,
            walkthrough: ['总分不同时，直接让总分高的人在前。', '总分相同才比较数学，避免后面的规则抢走前面的优先级。', '前两项仍相同，学号小的在前，顺序就唯一了。']
          },
          ['比较函数把降序和升序写反。', '总分相同后直接返回 false，漏掉后续条件。', '只排序总分，学号没有跟着学生移动。'],
          ['给两名同分学生，让学生先口头执行比较函数。', '写 return a.id<b.id 前问：这里为什么突然改成升序？']
        ),
        lesson('S2-2', '例题拆解：每一步都选眼前最合适的',
          '能提出一个贪心选择，并用“最坏对象必须处理”的理由解释它为什么不会吃亏。',
          [
            ['贪心（每一步先做眼前最划算的选择）', '贪心不是凭感觉挑，而是要说明这个选择不会让后面更差。'],
            ['双指针（从有序序列两头向中间走）', '左边指最轻，右边指最重，每轮至少处理最重的人。'],
            ['交换想法', '如果最重的人能和别人同船，和最轻的人配最容易成功。'],
            ['局部选择', '每轮只决定一条船，决定后把对应的人从待处理区移走。']
          ],
          {
            title: '最少小船数',
            statement: '每条船最多坐两人且总重量不超过 w，求把所有人运走至少需要几条船。',
            steps: ['把体重从小到大排序。', '最重的人一定要坐一条船，尝试带上最轻的人。', '能同船就两端一起收缩，否则只处理最重的人。'],
            code: `#include <algorithm>\n+#include <iostream>\n+#include <vector>\n+using namespace std;\n+int main() {\n+    int w, n; cin >> w >> n;\n+    vector<int> a(n);\n+    for (int& x : a) cin >> x;\n+    sort(a.begin(), a.end());\n+    int left = 0, right = n - 1, boats = 0;\n+    while (left <= right) {\n+        if (left < right && a[left] + a[right] <= w)\n+            left++; // 最轻者与最重者同船\n+        right--;    // 最重者本轮一定上船\n+        boats++;\n+    }\n+    cout << boats << '\\n';\n+    return 0;\n+}`,
            walkthrough: ['排序后先看最重的人，他不可能被留到别的选择里消失。', '若最轻的人都不能和他同船，其他人更不可能。', '若能同船，让最轻的人同行不会浪费更强的搭配机会。']
          },
          ['忘记先排序，左右两端没有轻重含义。', '只要两人就强行同船，没有检查重量和。', '只剩一人时还访问两个人的位置。'],
          ['先给 30、40、70、80 和上限 100，让学生配船。', '在“最轻也超重”处追问：为什么不用再试中间的人？']
        ),
        lesson('S2-3', '混合训练：按结束时间安排最多活动',
          '能把新的选择题转成排序后的单向扫描，并识别最早结束这一贪心抓手。',
          [
            ['区间', '一场活动用开始时间和结束时间表示，占住时间轴上的一段。'],
            ['相容', '后一场开始时间不早于前一场结束时间，两场才不冲突。'],
            ['最早结束', '越早空出场地，留给后面活动的时间越多。'],
            ['迁移', '遇到“最多参加几场、最多完成几个任务”，先试着画成时间段。']
          ],
          {
            title: '最多参加几场活动',
            statement: '给出 n 场活动的开始和结束时间，一个人不能同时参加两场，求最多参加几场。',
            steps: ['按结束时间从早到晚排序。', '记录上一场已选活动的结束时间。', '扫描活动，能接上就选择并更新结束时间。'],
            code: `#include <algorithm>\n+#include <iostream>\n+#include <vector>\n+using namespace std;\n+struct Event { int start, finish; };\n+int main() {\n+    int n; cin >> n;\n+    vector<Event> a(n);\n+    for (auto& e : a) cin >> e.start >> e.finish;\n+    sort(a.begin(), a.end(), [](Event x, Event y) {\n+        return x.finish < y.finish;\n+    });\n+    int answer = 0, last = -1;\n+    for (auto e : a) {\n+        if (e.start >= last) {\n+            answer++;\n+            last = e.finish;\n+        }\n+    }\n+    cout << answer << '\\n';\n+    return 0;\n+}`,
            walkthrough: ['先选结束最早的活动，它给后面留下最长的空闲部分。', '之后只关心当前活动能否接在 last 后面。', '选中后更新 last；没选中时 last 不变。']
          },
          ['按开始时间排序，看起来早却可能占很久。', '判断冲突时把 >= 写成 >，错过首尾相接。', '未选中的活动也更新了 last。'],
          ['画三条区间，让学生比较“最早开始”和“最早结束”。', '扫描到冲突活动时先让学生猜 last 会不会变化。']
        )
      ],
      exercises: [
        { luoguId: 'P1094', title: '纪念品分组', year: 2007, source: 'NOIP 普及组', difficulty: '普及-', hint: '排序后用双指针，每轮先安置最贵的纪念品。' },
        { luoguId: 'P1056', title: '排座椅', year: 2008, source: 'NOIP 普及组', difficulty: '普及-', hint: '统计每条通道能隔开多少对同学，再排序选最大的。' },
        { luoguId: 'P1068', title: '分数线划定', year: 2009, source: 'NOIP 普及组', difficulty: '普及-', hint: '按成绩降序、报名号升序排序，注意同分都录取。' },
        { luoguId: 'P1093', title: '奖学金', year: 2007, source: 'NOIP 普及组', difficulty: '普及-', hint: '把三层排名条件完整写进比较函数。' },
        { luoguId: 'P7072', title: '直播获奖', year: 2020, source: 'CSP-J', difficulty: '普及', hint: '分数范围很小，可用计数代替每次完整排序。' },
        { luoguId: 'P9749', title: '公路', year: 2023, source: 'CSP-J', difficulty: '普及', hint: '一路维护见过的最低油价，在便宜处提前买。' }
      ]
    },

    S3: {
      id: 'S3',
      title: '搜索',
      lessons: [
        lesson('S3-1', '建立模型：画出选择树',
          '能把“选或不选”的过程画成树，并用递归完整走完所有合法分支。',
          [
            ['搜索（系统地查看所有可能状态）', '不是乱试，而是按固定顺序进入每一种可能。'],
            ['深度优先搜索 DFS（沿一条路走到底再返回）', '先把当前选择做完，走不动时退回上一个岔路口。'],
            ['递归（函数调用自己处理下一层）', '这一层决定第几个数，下一层继续决定后面的数。'],
            ['终止条件', '已经选够 k 个数时立刻检查答案，不再继续往下选。']
          ],
          {
            title: '选 k 个数凑目标和',
            statement: '从 n 个整数中恰好选 k 个，统计有多少种选法的总和等于 target。',
            steps: ['递归参数记录当前位置、已选数量和当前总和。', '每个数都有“选”和“不选”两个分支。', '选够 k 个时检查总和并返回。'],
            code: `#include <iostream>\n+using namespace std;\n+int n, k, target, a[25], answer;\n+void dfs(int pos, int chosen, int sum) {\n+    if (chosen == k) {\n+        if (sum == target) answer++;\n+        return;\n+    }\n+    if (pos == n || chosen + n - pos < k) return;\n+    dfs(pos + 1, chosen + 1, sum + a[pos]); // 选\n+    dfs(pos + 1, chosen, sum);              // 不选\n+}\n+int main() {\n+    cin >> n >> k >> target;\n+    for (int i = 0; i < n; i++) cin >> a[i];\n+    dfs(0, 0, 0);\n+    cout << answer << '\\n';\n+    return 0;\n+}`,
            walkthrough: ['pos 指向现在要决定的数，两个递归分支覆盖选与不选。', 'chosen==k 时，这条选择已经完整，只检查一次。', '剩余数字不够凑满 k 个时提前返回，少走无用分支。']
          },
          ['只写“选”分支，漏掉大量方案。', '选够后没有 return，同一方案被继续扩展。', '把 pos 和 chosen 混在一起，无法判断还剩多少数。'],
          ['先用 3 个数画完整二叉选择树。', '到 chosen==k 时让学生猜：还应不应该继续搜索？']
        ),
        lesson('S3-2', '例题拆解：BFS 找最少步数',
          '能识别无权最短路，并用队列按距离一层一层扩展位置。',
          [
            ['广度优先搜索 BFS（先搜近处，再搜远处）', '像水波一样向外扩散，第一次到达某格就是最少步数。'],
            ['队列（先进入的状态先处理）', '距离较小的位置先入队，也会先被拿出来扩展。'],
            ['访问标记', '格子第一次到达后就标记，避免来回绕圈反复入队。'],
            ['无权最短路', '每走一步代价都相同，BFS 才能直接保证第一次到达最短。']
          ],
          {
            title: '迷宫最少步数',
            statement: 'n×m 地图中，0 能走、1 是墙，从左上角走到右下角，输出最少步数，走不到输出 -1。',
            steps: ['距离数组全部设为 -1，起点距离设为 0 后入队。', '每次取出队首，尝试上下左右四个相邻格。', '只把边界内、不是墙、没有访问过的格子入队。'],
            code: `#include <iostream>\n+#include <queue>\n+using namespace std;\n+int g[105][105], d[105][105];\n+int main() {\n+    int n, m; cin >> n >> m;\n+    for (int i=0;i<n;i++) for(int j=0;j<m;j++) {\n+        cin >> g[i][j]; d[i][j] = -1;\n+    }\n+    queue<pair<int,int>> q; q.push({0,0}); d[0][0]=0;\n+    int dx[4]={1,-1,0,0}, dy[4]={0,0,1,-1};\n+    while (!q.empty()) {\n+        auto [x,y]=q.front(); q.pop();\n+        for(int k=0;k<4;k++){\n+            int nx=x+dx[k], ny=y+dy[k];\n+            if(nx<0||nx>=n||ny<0||ny>=m) continue;\n+            if(g[nx][ny]||d[nx][ny]!=-1) continue;\n+            d[nx][ny]=d[x][y]+1; q.push({nx,ny});\n+        }\n+    }\n+    cout << d[n-1][m-1] << '\\n';\n+}`,
            walkthrough: ['起点距离为 0，离起点一步的格子都会得到 1。', '队列保证距离 1 的格子全部处理完，才轮到距离 2。', '某格第一次写入距离后不再入队，所以不会绕圈。']
          },
          ['入队时不标记，导致同一格被重复加入。', '先访问数组下标，再检查是否越界。', '墙和未访问都用 0 表示，条件混乱。'],
          ['在纸上画 4×4 迷宫，让学生逐层圈出水波。', '第一次到终点时追问：为什么不可能还有更短路线？']
        ),
        lesson('S3-3', '混合训练：回溯时撤销选择',
          '能在搜索中维护现场，并在返回上一层前撤销本层改动。',
          [
            ['回溯（试完一条路后恢复现场）', '摆下棋子后继续搜索，回来时必须把棋子拿走。'],
            ['冲突标记', '列和两条对角线是否被占，用三个数组快速查询。'],
            ['剪枝（提前砍掉一定失败的分支）', '当前位置已冲突，就不必继续摆后面的行。'],
            ['现场恢复', '做选择和撤销选择必须成对出现，否则别的分支会看到脏状态。']
          ],
          {
            title: 'n 皇后方案数',
            statement: '在 n×n 棋盘每行放一个皇后，任意两个皇后不能同列或同对角线，求方案数。',
            steps: ['按行递归，每层只决定这一行放在哪一列。', '用列、主对角线、副对角线三个数组判断冲突。', '放置后标记，递归返回后取消标记。'],
            code: `#include <iostream>\n+using namespace std;\n+int n, answer;\n+bool col[20], diag1[40], diag2[40];\n+void dfs(int row) {\n+    if (row == n) { answer++; return; }\n+    for (int c = 0; c < n; c++) {\n+        int d1 = row - c + n, d2 = row + c;\n+        if (col[c] || diag1[d1] || diag2[d2]) continue;\n+        col[c] = diag1[d1] = diag2[d2] = true;\n+        dfs(row + 1);\n+        col[c] = diag1[d1] = diag2[d2] = false; // 撤销\n+    }\n+}\n+int main() {\n+    cin >> n;\n+    dfs(0);\n+    cout << answer << '\\n';\n+}`,
            walkthrough: ['每层固定一行，所以不用再检查同一行冲突。', 'row-c 可能是负数，加 n 后才能安全当数组下标。', '递归返回后清除三个标记，下一列才能从同一现场出发。']
          },
          ['忘记撤销标记，后面的方案全部被误判冲突。', 'row-c 直接作为数组下标，出现负数。', '到 row==n 时忘记 return，又继续访问不存在的行。'],
          ['用 4 皇后先演示一次“放下—深入—拿走”。', '故意删掉撤销语句，让学生预测答案会变多还是变少。']
        )
      ],
      exercises: [
        { luoguId: 'P1028', title: '数的计算', year: 2001, source: 'NOIP 普及组', difficulty: '普及-', hint: '先写递归含义，再用记忆或递推避免重复计算。' },
        { luoguId: 'P1030', title: '求先序排列', year: 2001, source: 'NOIP 普及组', difficulty: '普及-', hint: '从后序找根，再在中序中切开左右子树。' },
        { luoguId: 'P1036', title: '选数', year: 2002, source: 'NOIP 普及组', difficulty: '普及-', hint: 'DFS 选择 k 个数，到叶子判断和是否为质数。' },
        { luoguId: 'P1087', title: 'FBI 树', year: 2004, source: 'NOIP 普及组', difficulty: '普及-', hint: '递归处理左右区间，最后输出当前节点。' },
        { luoguId: 'P5663', title: '加工零件', year: 2019, source: 'CSP-J', difficulty: '普及', hint: '在图上按奇偶步数分层，分别求最短可达距离。' },
        { luoguId: 'P7073', title: '表达式', year: 2020, source: 'CSP-J', difficulty: '普及', hint: '建表达式树，再追踪哪些变量真正影响根节点。' }
      ]
    },

    S4: {
      id: 'S4',
      title: '递推与动态规划',
      lessons: [
        lesson('S4-1', '建立模型：从小答案推出大答案',
          '能定义一个清楚的状态，写出它与更小状态的关系，并补齐初始值。',
          [
            ['递推（用已经算出的答案继续往后算）', '先知道走到第 1、2 级有几种方法，再推出第 3、4 级。'],
            ['状态', 'dp[i] 表示“恰好走到第 i 级的方案数”，一句话必须说完整。'],
            ['转移（小答案怎样组成大答案）', '最后一步走 1 级就来自 i-1，走 2 级就来自 i-2。'],
            ['初始值', '递推的起跑线要直接给出；没有起点，后面所有式子都算不出来。']
          ],
          {
            title: '爬楼梯方案数',
            statement: '每次可以走 1 级或 2 级台阶，求走到第 n 级一共有多少种不同走法。',
            steps: ['定义 dp[i] 为到达第 i 级的方案数。', '最后一步只有走 1 级或 2 级两种来源。', '得到 dp[i]=dp[i-1]+dp[i-2]，从小到大计算。'],
            code: `#include <iostream>\n+using namespace std;\n+int main() {\n+    int n; cin >> n;\n+    long long dp[55] = {};\n+    dp[0] = 1; // 什么也不走是一种起点方案\n+    if (n >= 1) dp[1] = 1;\n+    for (int i = 2; i <= n; i++)\n+        dp[i] = dp[i - 1] + dp[i - 2];\n+    cout << dp[n] << '\\n';\n+    return 0;\n+}`,
            walkthrough: ['dp[0]=1 表示从起点出发的空方案，方便统一转移。', '到第 2 级可从第 1 级走一步，也可从第 0 级走两步。', '每个方案的最后一步只能属于一种来源，所以相加不会重复。']
          },
          ['只写转移式，忘记给 dp[0]、dp[1]。', '状态没说“恰好到达”，把经过和到达混为一谈。', '答案增长快仍使用 int，发生溢出。'],
          ['让学生列出 n=1、2、3 的所有走法，再猜规律。', '问“每种完整走法的最后一步可能是什么”，引出转移。']
        ),
        lesson('S4-2', '例题拆解：每件物品只能选一次',
          '能用一维数组完成 0/1 背包，并解释容量为什么必须倒着更新。',
          [
            ['动态规划 DP（把重复的小问题答案保存下来）', '同一个容量的最优价值会被后面的物品反复用到，先存起来就不用重算。'],
            ['0/1 背包', '每件物品只有选或不选两种，不能重复拿。'],
            ['容量状态', 'dp[j] 表示容量不超过 j 时能得到的最大价值。'],
            ['倒序更新', '从大容量往小容量算，保证当前物品本轮只被使用一次。']
          ],
          {
            title: '采药',
            statement: '总时间为 T，有 n 株药，每株有采摘时间和价值，每株最多采一次，求最大总价值。',
            steps: ['dp[j] 记录时间上限 j 内的最大价值。', '枚举每株药，再让 j 从 T 倒着走到该药耗时。', '比较不采与采这一株两种结果，取较大值。'],
            code: `#include <algorithm>\n+#include <iostream>\n+using namespace std;\n+int main() {\n+    int T, n; cin >> T >> n;\n+    int dp[1005] = {};\n+    for (int i = 0; i < n; i++) {\n+        int cost, value;\n+        cin >> cost >> value;\n+        for (int j = T; j >= cost; j--) {\n+            dp[j] = max(dp[j], dp[j - cost] + value);\n+        }\n+    }\n+    cout << dp[T] << '\\n';\n+    return 0;\n+}`,
            walkthrough: ['dp[j] 原值代表不采当前药。', 'dp[j-cost]+value 代表给当前药腾出时间后再采它。', '倒序让 dp[j-cost] 仍是上一轮结果，不会在同一轮重复使用当前药。']
          },
          ['容量正序更新，把同一株药采了很多次。', 'j 从 0 开始，访问 j-cost 的负下标。', '把 cost 和 value 在转移式里写反。'],
          ['先把容量循环改成正序，让学生找出一株药被重复使用的证据。', '转移前问：不采和采当前药分别对应哪一项？']
        ),
        lesson('S4-3', '混合训练：二维网格上的最优路线',
          '能根据允许的移动方向确定前驱状态，并完成二维动态规划。',
          [
            ['前驱（能够一步走到当前状态的旧状态）', '只能向右或向下时，一个格子只可能从上方或左方到达。'],
            ['二维状态', 'dp[i][j] 表示走到第 i 行第 j 列时最多收集的金币。'],
            ['最优子结构', '最优路线到达当前格前，也必须采用某个前驱格的最优路线。'],
            ['边界行列', '第一行没有上方，第一列没有左方，可以用额外的第 0 行和第 0 列统一处理。']
          ],
          {
            title: '网格收集金币',
            statement: '从左上角走到右下角，每次只能向右或向下，经过格子就得到其中金币，求最多金币。',
            steps: ['按从上到下、从左到右的顺序填表。', '当前格只比较上方和左方的最大值。', '取较大前驱并加上当前格金币。'],
            code: `#include <algorithm>\n+#include <iostream>\n+using namespace std;\n+long long dp[505][505];\n+int main() {\n+    int n, m; cin >> n >> m;\n+    for (int i = 1; i <= n; i++) {\n+        for (int j = 1; j <= m; j++) {\n+            int coin; cin >> coin;\n+            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]) + coin;\n+        }\n+    }\n+    cout << dp[n][m] << '\\n';\n+    return 0;\n+}`,
            walkthrough: ['填 dp[i][j] 时，上方和左方已经算好。', '所有到当前格的合法路线，最后一步必定来自这两个方向之一。', '因此只需保留较大的前驱答案，不必保存整条路线。']
          },
          ['循环顺序乱写，使用了尚未计算的状态。', '误把右方或下方当成前驱。', '金币总和可能很大却使用 int。'],
          ['用 3×3 小表让学生亲手填完每个格子。', '在中间格提问：所有路线的最后一步有几种可能？']
        )
      ],
      exercises: [
        { luoguId: 'P1048', title: '采药', year: 2005, source: 'NOIP 普及组', difficulty: '普及-', hint: '一维 0/1 背包，容量必须倒序。' },
        { luoguId: 'P1049', title: '装箱问题', year: 2001, source: 'NOIP 普及组', difficulty: '普及-', hint: '把“剩余最小”改写成“装入体积最大”。' },
        { luoguId: 'P1095', title: '守望者的逃离', year: 2007, source: 'NOIP 普及组', difficulty: '普及', hint: '按秒递推可达最远距离，再与跑步方案合并。' },
        { luoguId: 'P1077', title: '摆花', year: 2012, source: 'NOIP 普及组', difficulty: '普及', hint: 'dp[i][j] 表示前 i 种花摆 j 盆的方案数。' },
        { luoguId: 'P5662', title: '纪念品', year: 2019, source: 'CSP-J', difficulty: '普及', hint: '每天把本金当背包容量，做一次完全背包。' },
        { luoguId: 'P7074', title: '方格取数', year: 2020, source: 'CSP-J', difficulty: '普及', hint: '列方向固定，行方向有上下两种，要分两遍转移。' }
      ]
    },

    S5: {
      id: 'S5',
      title: '字符串处理',
      lessons: [
        lesson('S5-1', '建立模型：一个字符一个字符扫描',
          '能区分字符和数字，并用一次扫描完成分类统计。',
          [
            ['字符串（按顺序排成一行的字符）', '名字、句子和数字文本都可以作为字符串逐个查看。'],
            ['字符', '字符 7 和整数 7 不是一回事；字符 7 的写法是单引号包住的 ‘7’。'],
            ['字符分类', '先判断是否为字母、数字或空格，再累加各自计数。'],
            ['整行输入', '句子中可能有空格，要用 getline 读取整行，cin>>s 会在空格处停下。']
          ],
          {
            title: '统计句子成分',
            statement: '读入一整行，分别输出英文字母、数字和空格的数量，其他符号忽略。',
            steps: ['用 getline 读入完整句子。', '逐个检查字符所在的范围。', '三个计数器分别累加，最后一起输出。'],
            code: `#include <iostream>\n+#include <string>\n+using namespace std;\n+int main() {\n+    string s;\n+    getline(cin, s);\n+    int letters = 0, digits = 0, spaces = 0;\n+    for (char c : s) {\n+        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))\n+            letters++;\n+        else if (c >= '0' && c <= '9')\n+            digits++;\n+        else if (c == ' ')\n+            spaces++;\n+    }\n+    cout << letters << ' ' << digits << ' ' << spaces << '\\n';\n+    return 0;\n+}`,
            walkthrough: ['输入 Hi 2026! 时，H、i 计入字母。', '2、0、2、6 计入数字，中间空格单独计数。', '感叹号不属于三类，所以跳过。']
          },
          ['用 cin>>s，空格后的内容没有读入。', '把字符 c 与整数 0、9 比较，而不是字符 0、9。', '三个 if 全部独立，分类条件重叠时重复计数。'],
          ['输入 A1 !，让学生先给每个字符贴分类标签。', '演示 cin 与 getline 的差别，让学生观察空格后内容是否还在。']
        ),
        lesson('S5-2', '例题拆解：统一大小写后查找单词',
          '能先把文本标准化，再按完整单词匹配并记录第一次出现位置。',
          [
            ['标准化', '把大小写都转成小写，后面的比较就只需一套规则。'],
            ['完整单词', '查 he 时不能误把 the 中的 he 算进去，需要检查单词边界。'],
            ['分词', '用空格把一行切成一个个单词，同时记录每个单词的起点。'],
            ['位置', '题目通常要求原文中的字符位置，不是“第几个单词”。']
          ],
          {
            title: '统计完整单词',
            statement: '输入目标单词和一行英文文本，不分大小写统计完整单词出现次数，并输出第一次出现的字符下标。',
            steps: ['把目标和正文全部转成小写。', '在正文首尾各补一个空格，把单词边界统一。', '查找“空格+目标+空格”，每次命中后继续向后找。'],
            code: `#include <cctype>\n+#include <iostream>\n+#include <string>\n+using namespace std;\n+int main() {\n+    string word, text;\n+    getline(cin, word); getline(cin, text);\n+    for (char& c : word) c = tolower((unsigned char)c);\n+    for (char& c : text) c = tolower((unsigned char)c);\n+    string hay = " " + text + " ";\n+    string needle = " " + word + " ";\n+    int count = 0, first = -1;\n+    size_t pos = hay.find(needle);\n+    while (pos != string::npos) {\n+        if (first == -1) first = (int)pos;\n+        count++;\n+        pos = hay.find(needle, pos + 1);\n+    }\n+    if (!count) cout << -1 << '\\n';\n+    else cout << count << ' ' << first << '\\n';\n+}`,
            walkthrough: ['补上的开头空格让正文第一个单词也有统一左边界。', 'pos 在补空格后的字符串中，恰好等于原文单词起点。', '从 pos+1 继续寻找，避免永远找到同一个位置。']
          },
          ['直接查子串，把单词内部也算作命中。', '只转换目标单词大小写，正文没有转换。', 'find 失败返回 string::npos，却拿它当普通下标。'],
          ['用目标 he 和文本 The he，让学生判断应出现几次。', '补首尾空格前先问：正文第一个单词的左边界在哪里？']
        ),
        lesson('S5-3', '混合训练：边扫描边压缩连续字符',
          '能维护当前连续段，在字符发生变化时结算上一段。',
          [
            ['连续段', 'aaabb 中 aaa 是一段，bb 是下一段，每段字符相同。'],
            ['段状态', '只需记当前字符和当前段长度，不必保存每个位置的重复信息。'],
            ['结算', '遇到不同字符时先输出旧段，再开始新段。'],
            ['收尾处理', '循环结束后没有新字符帮忙触发结算，所以最后一段要单独输出。']
          ],
          {
            title: '游程压缩',
            statement: '把只含大小写字母的字符串压缩为“字符+连续次数”，例如 aaabbC 变成 a3b2C1。',
            steps: ['空串直接结束；否则用第一个字符开始第一段。', '后续字符相同就增加长度，不同就输出旧段并重置。', '循环结束后输出最后一段。'],
            code: `#include <iostream>\n+#include <string>\n+using namespace std;\n+int main() {\n+    string s; cin >> s;\n+    if (s.empty()) return 0;\n+    char current = s[0];\n+    int length = 1;\n+    for (int i = 1; i < (int)s.size(); i++) {\n+        if (s[i] == current) length++;\n+        else {\n+            cout << current << length;\n+            current = s[i];\n+            length = 1;\n+        }\n+    }\n+    cout << current << length << '\\n'; // 最后一段\n+    return 0;\n+}`,
            walkthrough: ['读到连续的 a 时，只增加 length。', '第一次读到 b 时，先输出 a 段，再把 current 改成 b。', '字符串结束后手动输出最后的 C1，否则它会丢失。']
          },
          ['循环仍从下标 0 开始，第一个字符被数了两次。', '字符变化时先覆盖 current，导致输出错字符。', '忘记循环后的最后一次结算。'],
          ['先用 aaa 追问：循环中一次变化都没有，答案在哪里输出？', '让学生扮演 current 与 length，逐字符报状态。']
        )
      ],
      exercises: [
        { luoguId: 'P1055', title: 'ISBN 号码', year: 2008, source: 'NOIP 普及组', difficulty: '入门', hint: '按固定位置取数字，最后一位要特别处理 X。' },
        { luoguId: 'P1308', title: '统计单词数', year: 2011, source: 'NOIP 普及组', difficulty: '普及-', hint: '统一大小写，并用空格保护完整单词边界。' },
        { luoguId: 'P1067', title: '多项式输出', year: 2009, source: 'NOIP 普及组', difficulty: '普及-', hint: '把首项、系数绝对值为 1、次数 0/1 分开讨论。' },
        { luoguId: 'P3955', title: '图书管理员', year: 2017, source: 'NOIP 普及组', difficulty: '普及-', hint: '用取模得到编号后缀，再找最小匹配编号。' },
        { luoguId: 'P5015', title: '标题统计', year: 2018, source: 'NOIP 普及组', difficulty: '入门', hint: '读取整行，只跳过空格和换行。' },
        { luoguId: 'P7911', title: '网络连接', year: 2021, source: 'CSP-J', difficulty: '普及', hint: '先严格校验地址格式，再用映射记录服务端首次出现位置。' }
      ]
    },

    S6: {
      id: 'S6',
      title: '数据结构应用',
      lessons: [
        lesson('S6-1', '建立模型：栈只看最近未完成任务',
          '能识别后进先出的配对过程，并用栈检查括号是否合法。',
          [
            ['数据结构（组织和取用数据的规则）', '同一批数据按不同规则存放，会让某些操作变得很快。'],
            ['栈（后放进去的先拿出来）', '像一摞盘子，最后放上的盘子最先被取走。'],
            ['栈顶', '括号配对时，只需要查看最近一个还没匹配的左括号。'],
            ['后进先出', '内层括号必须先闭合，正好对应最后压栈的左括号先弹出。']
          ],
          {
            title: '括号匹配',
            statement: '给定只含 ()[]{} 的字符串，判断所有括号是否类型正确、顺序正确并且全部配对。',
            steps: ['遇到左括号就压入栈。', '遇到右括号先检查栈是否为空，再检查栈顶类型。', '匹配则弹出；扫描结束后栈也必须为空。'],
            code: `#include <iostream>\n+#include <stack>\n+#include <string>\n+using namespace std;\n+bool match(char left, char right) {\n+    return (left=='('&&right==')') ||\n+           (left=='['&&right==']') ||\n+           (left=='{'&&right=='}');\n+}\n+int main() {\n+    string s; cin >> s;\n+    stack<char> st;\n+    for (char c : s) {\n+        if (c=='(' || c=='[' || c=='{') st.push(c);\n+        else {\n+            if (st.empty() || !match(st.top(), c)) {\n+                cout << "NO\\n"; return 0;\n+            }\n+            st.pop();\n+        }\n+    }\n+    cout << (st.empty() ? "YES\\n" : "NO\\n");\n+}`,
            walkthrough: ['读到 ([ 时，栈顶是 [，它必须先与 ] 配对。', '右括号到来而栈为空，说明没有可配对的左括号。', '扫描完栈非空，说明还有左括号没有闭合。']
          },
          ['在检查 empty 之前就调用 top，程序可能崩溃。', '只判断左右数量相同，没有检查嵌套顺序。', '扫描结束直接输出 YES，忘记检查栈是否为空。'],
          ['用 ([)] 让学生预测：数量相同为什么仍不合法？', '第一次遇到右括号时，追问程序此刻只需要看哪里。']
        ),
        lesson('S6-2', '例题拆解：队列维护时间窗口',
          '能用先进先出的队列及时删除过期数据，维护最近一段时间内的事件数量。',
          [
            ['队列（先放进去的先拿出来）', '像排队买票，最早来的人最先离开。'],
            ['队首', '时间窗口里最可能过期的一定是最早进入的事件。'],
            ['滑动窗口', '“最近 60 秒”会随当前时间向前移动，旧事件不断从左边掉出去。'],
            ['摊还效率', '每个时间只进队一次、出队一次，所以总工作量是线性的。']
          ],
          {
            title: '最近 60 秒事件数',
            statement: '事件时间按不下降顺序到来；每读入一个时间 t，输出区间 [t-59,t] 内的事件数量。',
            steps: ['当前事件时间入队。', '不断删除小于 t-59 的队首时间。', '队列当前长度就是最近 60 秒事件数。'],
            code: `#include <iostream>\n+#include <queue>\n+using namespace std;\n+int main() {\n+    int n; cin >> n;\n+    queue<int> q;\n+    for (int i = 0; i < n; i++) {\n+        int t; cin >> t;\n+        q.push(t);\n+        while (!q.empty() && q.front() < t - 59)\n+            q.pop(); // 删除窗口左边的旧事件\n+        cout << q.size() << '\\n';\n+    }\n+    return 0;\n+}`,
            walkthrough: ['时间按顺序到来，所以最旧时间一直在队首。', 't-59 仍在窗口内，只删除严格更小的时间。', '旧事件删除后，队列中恰好全是当前窗口事件。']
          },
          ['把 < 写成 <=，误删窗口左端点。', '只用 if 删除一个过期事件，队首后面可能还有旧事件。', '输入时间不是有序的却仍直接使用普通队列。'],
          ['用时间 1、2、60、61 手工维护队列。', '在 t=61 时问：时间 1 还在不在 [2,61]？']
        ),
        lesson('S6-3', '混合训练：用树保存分叉关系',
          '能用左右孩子数组表示二叉树，并按“根—左—右”的规则完成先序遍历。',
          [
            ['树（有层级的分叉结构）', '每个节点可以连向孩子，像家谱或文件夹目录。'],
            ['二叉树', '每个节点最多有左、右两个孩子，孩子编号为 0 表示不存在。'],
            ['先序遍历', '先访问当前根，再完整访问左子树，最后完整访问右子树。'],
            ['递归子问题', '遍历一棵大树，等于输出根，再用同样办法遍历两棵更小的树。']
          ],
          {
            title: '输出二叉树先序序列',
            statement: '节点编号为 1 到 n，输入每个节点的左右孩子编号，根为 1，输出先序遍历编号。',
            steps: ['用 leftChild、rightChild 数组保存两条孩子关系。', '递归函数收到 0 就返回。', '先输出自己，再递归左孩子和右孩子。'],
            code: `#include <iostream>\n+using namespace std;\n+int leftChild[1005], rightChild[1005];\n+void preorder(int u) {\n+    if (u == 0) return;\n+    cout << u << ' ';       // 先访问根\n+    preorder(leftChild[u]); // 再访问左子树\n+    preorder(rightChild[u]);// 最后访问右子树\n+}\n+int main() {\n+    int n; cin >> n;\n+    for (int i = 1; i <= n; i++)\n+        cin >> leftChild[i] >> rightChild[i];\n+    preorder(1);\n+    return 0;\n+}`,
            walkthrough: ['preorder(1) 先输出根节点 1。', '进入左孩子后，会把整棵左子树处理完才返回。', '左子树完成后才进入右孩子，顺序正是根—左—右。']
          },
          ['没有把 0 当空节点，递归访问无效位置。', '输出语句放在两个递归之间，写成了中序遍历。', '默认根一定是 1，而题目若未保证就需要另外找根。'],
          ['画一棵 5 节点小树，让学生口述递归调用顺序。', '移动输出语句的位置，让学生比较先序、中序、后序。']
        )
      ],
      exercises: [
        { luoguId: 'P1981', title: '表达式求值', year: 2013, source: 'NOIP 普及组', difficulty: '普及-', hint: '利用乘法优先级，维护当前乘法段或使用栈。' },
        { luoguId: 'P2058', title: '海港', year: 2016, source: 'NOIP 普及组', difficulty: '普及', hint: '队列删除 24 小时前船只，并维护各国人数计数。' },
        { luoguId: 'P5018', title: '对称二叉树', year: 2018, source: 'NOIP 普及组', difficulty: '普及', hint: '递归比较左右子树是否镜像，同时统计子树大小。' },
        { luoguId: 'P5661', title: '公交换乘', year: 2019, source: 'CSP-J', difficulty: '普及', hint: '按时间维护还有效、还没用过的地铁优惠票。' },
        { luoguId: 'P7912', title: '小熊的果篮', year: 2021, source: 'CSP-J', difficulty: '普及', hint: '用链表跳过已经删除的位置，维护颜色段首。' },
        { luoguId: 'P8815', title: '逻辑表达式', year: 2022, source: 'CSP-J', difficulty: '普及', hint: '用栈或表达式树求值，并统计短路运算次数。' }
      ]
    }
  };
})();

