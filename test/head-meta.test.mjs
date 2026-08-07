// 小图灵信奥学习站 · 首页社交预览元信息契约测试（零第三方依赖，node --test）
//
// 背景：index.html 的 <head> 里带着一组“对外触达”元信息——
//   description / theme-color / canonical / Open Graph（og:*）/ Twitter Card（twitter:*）。
//   它们决定了这个站被分享到微信 / QQ / 微博 / Twitter 时能不能显示标题、描述和预览卡。
//   这类标签有个通病：不影响页面渲染，删了也“看着没坏”，所以极易在后续改 <head>
//   （换标题、调 favicon、加脚本）时被顺手删掉或改错，社交预览就静默退回灰链接。
//
// 现有 data-integrity / teacher-answer-render 测试守护的是“数据/教师态内容对不对”；
// 本文件补上另一面——“首页对外触达元信息不能缺、不能自相矛盾”，把这条隐性契约变成回归护栏。
// 当前仓库这些标签 100% 齐备且互相一致，所以本测试现在全绿；将来改 <head> 若漏删或改歪，才会变红。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');

// 只取 <head>…</head> 区间，避免误匹配 body 内容
const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
assert.ok(headMatch, 'index.html 必须有 <head> 区块');
const head = headMatch[1];

// 提取 <meta name="X" content="Y"> / <meta property="X" content="Y"> 的 content（属性顺序无关）
const metaContent = (key) => {
  const re = new RegExp(
    `<meta\\s+[^>]*?(?:name|property)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*?content=["']([^"']*)["']`,
    'i',
  );
  const m = head.match(re);
  return m ? m[1].trim() : null;
};
// 提取 <link rel="canonical" href="Y">
const linkHref = (rel) => {
  const re = new RegExp(`<link\\s+[^>]*?rel=["']${rel}["'][^>]*?href=["']([^"']*)["']`, 'i');
  const m = head.match(re);
  return m ? m[1].trim() : null;
};

const filled = (v) => typeof v === 'string' && v.trim().length > 0;

test('首页有非空 <title>', () => {
  const m = head.match(/<title>([^<]*)<\/title>/i);
  assert.ok(m && filled(m[1]), '<title> 缺失或为空');
});

test('基础 meta 齐备：viewport / description', () => {
  const re = /<meta\s+[^>]*?name=["']viewport["']/i;
  assert.ok(re.test(head), 'viewport meta 缺失');
  assert.ok(filled(metaContent('description')), 'description meta 缺失或为空');
});

test('Open Graph 六项齐备且非空', () => {
  for (const k of ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url']) {
    assert.ok(filled(metaContent(k)), `${k} 缺失或为空`);
  }
});

test('Twitter Card 三项齐备且非空', () => {
  for (const k of ['twitter:card', 'twitter:title', 'twitter:description']) {
    assert.ok(filled(metaContent(k)), `${k} 缺失或为空`);
  }
});

test('canonical 与 og:url 一致，且为 https 绝对地址', () => {
  const canonical = linkHref('canonical');
  const ogUrl = metaContent('og:url');
  assert.ok(filled(canonical), 'canonical 链接缺失或为空');
  assert.ok(/^https:\/\//.test(ogUrl), `og:url 应为 https 绝对地址，实际：${ogUrl}`);
  assert.equal(canonical, ogUrl, 'canonical 与 og:url 必须指向同一地址');
});

test('og 与 twitter 的标题 / 描述保持一致（避免分享文案分叉）', () => {
  assert.equal(metaContent('og:title'), metaContent('twitter:title'), 'og:title 与 twitter:title 应一致');
  assert.equal(
    metaContent('og:description'),
    metaContent('twitter:description'),
    'og:description 与 twitter:description 应一致',
  );
});

test('theme-color 为合法十六进制色值', () => {
  const tc = metaContent('theme-color');
  assert.ok(filled(tc), 'theme-color 缺失或为空');
  assert.ok(/^#[0-9a-fA-F]{3,8}$/.test(tc), `theme-color 非法色值：${tc}`);
});

// JSON-LD 结构化数据契约：<head> 里应有一段合法 application/ld+json，
// 声明本站为 schema.org 的 WebSite + Course，供搜索引擎生成教育类富结果。
// 这段 JSON 手写易出语法错（多余逗号、引号未转义）而页面照常渲染、肉眼不报错，
// 一旦 JSON.parse 失败搜索引擎会静默丢弃整段结构化数据；本测试把“能被解析且类型齐备”钉成回归护栏。
test('结构化数据：head 内含合法 JSON-LD 且声明 WebSite + Course', () => {
  const m = head.match(/<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/i);
  assert.ok(m, 'head 缺少 application/ld+json 结构化数据');
  let data;
  assert.doesNotThrow(() => {
    data = JSON.parse(m[1]);
  }, 'JSON-LD 必须是合法 JSON（检查多余逗号 / 引号）');
  assert.equal(data['@context'], 'https://schema.org', 'JSON-LD @context 应为 https://schema.org');
  const nodes = Array.isArray(data['@graph']) ? data['@graph'] : [data];
  const types = nodes.map((n) => n && n['@type']);
  assert.ok(types.includes('WebSite'), 'JSON-LD 应含 WebSite 节点');
  assert.ok(types.includes('Course'), 'JSON-LD 应含 Course 节点');
  const course = nodes.find((n) => n && n['@type'] === 'Course');
  assert.ok(filled(course.name), 'Course.name 缺失或为空');
  assert.ok(course.hasCourseInstance && course.hasCourseInstance.courseMode, 'Course 应含 hasCourseInstance.courseMode');
});
