// 小图灵信奥学习站 · 判分门契约回归测试（零第三方依赖，node --test）
//
// 学生"是否过关、能否解锁下一关"由两处共同决定，它们必须始终一致：
//   - 展示层 app.js：过关判定写作 `score >= config.passScore`，会自动跟随配置；
//   - 持久层 store.js：写入 completedLevels / 解锁进度时用一个"及格线"阈值判断。
// 隐患：store.js 目前把及格线写成字面量数字。一旦有人在 data/config.js 里调高或调低
// passScore，展示层立刻跟随，持久层却纹丝不动——学生可能看到"还差一点"却被解锁下一关，
// 或看到"过关成功"却没解锁。本契约把持久层阈值钉死在 config.passScore 上，防止静默漂移；
// 数值本身的合法区间由 data-integrity 负责，这里只守"两侧一致"。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadData } from '../scripts/load-data.mjs';

const passScore = loadData().CSPJ_DATA.config.passScore;
const readSrc = (name) => fs.readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8');

test('config.passScore 是整数及格线（作为契约锚点）', () => {
  assert.ok(Number.isInteger(passScore) && passScore > 0 && passScore <= 100, `passScore=${passScore} 应为 (0,100] 的整数`);
});

test('store.js：持久层过关阈值必须等于 config.passScore（防止静默漂移）', () => {
  const src = readSrc('store.js');
  const gates = [...src.matchAll(/record\.score\s*>=\s*(\d+)/g)].map((m) => Number(m[1]));
  assert.ok(gates.length > 0, 'store.js 未找到 `record.score >= N` 形式的过关判定，源码结构已变，契约测试需同步更新');
  for (const gate of gates) {
    assert.equal(gate, passScore, `store.js 过关阈值 ${gate} 与 config.passScore ${passScore} 不一致：改配置时请同步 store.js，或让 store 直接读取 config.passScore`);
  }
});

test('app.js：展示层过关判定用符号引用 config.passScore（作为唯一真源）', () => {
  const src = readSrc('app.js');
  assert.match(src, /score\s*>=\s*config\.passScore/, 'app.js 过关判定应写作 `score >= config.passScore`，以便自动跟随配置');
});
