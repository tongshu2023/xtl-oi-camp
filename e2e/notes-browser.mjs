import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const cdpBase = process.env.CDP_URL || 'http://127.0.0.1:9338';
const projectDir = process.env.PROJECT_DIR || process.cwd();
const pageUrl = process.env.PAGE_URL || `${pathToFileURL(path.join(projectDir, 'academy.html')).href}#/lesson/J1`;
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function newTarget(url) {
  const response = await fetch(`${cdpBase}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`无法创建 Chrome 测试页：HTTP ${response.status}`);
  return response.json();
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Chrome 调试连接超时')), 8000);
      this.socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Chrome 调试连接失败')); }, { once: true });
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result || {});
        return;
      }
      if (message.method && this.listeners.has(message.method)) {
        for (const listener of this.listeners.get(message.method)) listener(message.params || {});
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const listener = params => {
        clearTimeout(timer);
        this.listeners.get(method).delete(listener);
        resolve(params);
      };
      if (!this.listeners.has(method)) this.listeners.set(method, new Set());
      this.listeners.get(method).add(listener);
      const timer = setTimeout(() => {
        this.listeners.get(method).delete(listener);
        reject(new Error(`等待 ${method} 超时`));
      }, timeout);
    });
  }

  async close() {
    if (!this.socket || this.socket.readyState >= 2) return;
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 500);
      this.socket.addEventListener('close', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.close();
    });
  }
}

async function main() {
  const target = await newTarget(pageUrl);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  const results = {};

  async function evaluate(expression) {
    const response = await client.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || '页面脚本执行失败');
    }
    return response.result?.value;
  }

  async function waitFor(expression, timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (await evaluate(expression)) return;
      await delay(80);
    }
    throw new Error(`等待页面状态超时：${expression}`);
  }

  try {
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await waitFor("document.readyState === 'complete' && !!window.AcademyNotesStore");
    await evaluate(`(async () => {
      const notes=await window.AcademyNotesStore.all();
      await Promise.all(notes.map(note=>window.AcademyNotesStore.remove(note.id)));
      return true;
    })()`);
    const cleanLoad = client.once('Page.loadEventFired');
    await client.send('Page.reload', { ignoreCache: true });
    await cleanLoad;
    await waitFor("document.readyState === 'complete' && !!window.AcademyNotesStore");
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
    });
    await delay(200);

    results.page = await evaluate("document.title + '|' + location.hash");
    results.stableBlocks = await evaluate("document.querySelectorAll('[data-note-block]').length");
    results.quizOptions = await evaluate("document.querySelectorAll('#lesson-quiz .options label').length");
    assert.match(results.page, /小图灵信奥学习站\|#\/lesson\/J1/);
    assert.ok(results.stableBlocks >= 10);
    assert.equal(results.quizOptions, 20);

    await evaluate(`(() => {
      const p=document.querySelector('[data-note-block="J1-concept-0"] p');
      const node=document.createTreeWalker(p,NodeFilter.SHOW_TEXT).nextNode();
      const range=document.createRange();
      range.setStart(node,0);
      range.setEnd(node,Math.min(12,node.nodeValue.length));
      const selection=getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      p.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,button:0}));
    })()`);
    await waitFor("!document.getElementById('notes-selection-toolbar').hidden");
    results.toolbarVisible = true;
    await evaluate("document.querySelector('[data-note-action=thought]').click()");
    await waitFor("document.getElementById('notes-drawer').classList.contains('open') && !!document.querySelector('.notes-editor')");
    results.editorQuote = await evaluate("document.querySelector('.notes-editor blockquote').textContent");
    await evaluate(`document.getElementById('note-thought').value='我用这条笔记验证刷新后仍能找回原文。';
      document.querySelector('[data-note-save]').click()`);
    await waitFor("window.AcademyNotesStore.all().then(notes=>notes.length===1 && notes[0].thought.length>0)");
    results.savedCount = await evaluate("window.AcademyNotesStore.all().then(notes=>notes.length)");
    results.savedThought = await evaluate("window.AcademyNotesStore.all().then(notes=>notes[0].thought)");
    results.highlightCount = await evaluate("document.querySelectorAll('mark.course-note-highlight').length");
    results.exportContract = await evaluate(`(async () => {
      const original=HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click=function(){window.__exportLink={href:this.href,download:this.download};};
      document.querySelector('[data-notes-export]').click();
      const payload=await fetch(window.__exportLink.href).then(response=>response.json());
      HTMLAnchorElement.prototype.click=original;
      return {schema:payload.schema,version:payload.version,count:payload.notes.length,name:window.__exportLink.download};
    })()`);
    assert.deepEqual(results.exportContract, {
      schema: 'xiaoturing-academy-notes',
      version: 1,
      count: 1,
      name: `xiaoturing-notes-${new Date().toISOString().slice(0, 10)}.json`
    });
    const exportPayload = await evaluate("window.AcademyNotesStore.all().then(notes=>window.AcademyNotesStore.exportPayload(notes))");

    const loadEvent = client.once('Page.loadEventFired');
    await client.send('Page.reload', { ignoreCache: true });
    await loadEvent;
    await waitFor("!!window.AcademyNotesStore && document.querySelectorAll('mark.course-note-highlight').length>0");
    results.afterReloadCount = await evaluate("window.AcademyNotesStore.all().then(notes=>notes.length)");
    results.afterReloadHighlights = await evaluate("document.querySelectorAll('mark.course-note-highlight').length");
    results.headerCurrentCount = await evaluate("document.querySelector('[data-notes-count]').textContent");
    assert.equal(results.afterReloadCount, 1);
    assert.ok(results.afterReloadHighlights > 0);
    assert.equal(results.headerCurrentCount, '1');

    await evaluate("document.querySelector('[data-notes-open]').click(); document.querySelector('[data-note-open]').click()");
    await waitFor("!!document.querySelector('.notes-editor') && document.querySelector('mark.course-note-highlight').classList.contains('flash')");
    await delay(700);
    results.listScrollsToHighlight = await evaluate(`(() => {
      const rect=document.querySelector('mark.course-note-highlight').getBoundingClientRect();
      return rect.top>=0 && rect.bottom<=innerHeight;
    })()`);
    assert.equal(results.listScrollsToHighlight, true);
    await evaluate(`document.getElementById('note-thought').value='刷新后编辑成功';
      document.querySelector('[data-note-save]').click()`);
    await waitFor("window.AcademyNotesStore.all().then(notes=>notes[0].thought==='刷新后编辑成功')");
    results.editedThought = await evaluate("window.AcademyNotesStore.all().then(notes=>notes[0].thought)");
    await evaluate("document.querySelector('[data-note-remove-thought]').click()");
    await waitFor("window.AcademyNotesStore.all().then(notes=>notes[0].thought==='' && document.querySelectorAll('mark.course-note-highlight').length>0)");
    results.removeThoughtKeepsHighlight = true;
    await evaluate("document.querySelector('[data-note-delete]').click()");
    await waitFor("window.AcademyNotesStore.all().then(notes=>notes.length===0)");
    results.afterDelete = 0;

    await evaluate(`(() => {
      const input=document.getElementById('notes-import-file');
      const file=new File([${JSON.stringify(JSON.stringify(exportPayload))}],'notes.json',{type:'application/json'});
      const transfer=new DataTransfer();
      transfer.items.add(file);
      Object.defineProperty(input,'files',{value:transfer.files,configurable:true});
      input.dispatchEvent(new Event('change',{bubbles:true}));
    })()`);
    await waitFor("window.AcademyNotesStore.all().then(notes=>notes.length===1)");
    results.afterImport = 1;
    results.afterImportHighlights = await evaluate("document.querySelectorAll('mark.course-note-highlight').length");
    results.malformedRejected = await evaluate("window.AcademyNotesStore.importPayload({schema:'bad',version:1,notes:[]}).then(()=>false,()=>true)");
    results.afterMalformedUnchanged = await evaluate("window.AcademyNotesStore.all().then(notes=>notes.length)");
    results.shiftedAnchorResolved = await evaluate(`window.AcademyNotesStore.all().then(notes => {
      const note=notes[0];
      const text='新增说明：'+document.querySelector('[data-note-block="'+note.blockId+'"]').textContent;
      const anchor=window.AcademyNotesTest.resolveAnchor(text,note);
      return !!anchor && anchor.start>note.startHint;
    })`);
    assert.ok(results.afterImportHighlights > 0);
    assert.equal(results.malformedRejected, true);
    assert.equal(results.afterMalformedUnchanged, 1);
    assert.equal(results.shiftedAnchorResolved, true);

    await evaluate(`(() => {
      const mark=document.querySelector('mark.course-note-highlight');
      const node=document.createTreeWalker(mark,NodeFilter.SHOW_TEXT).nextNode();
      const range=document.createRange();
      range.selectNodeContents(node);
      const selection=getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      mark.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,button:0}));
    })()`);
    await waitFor("!document.getElementById('notes-selection-toolbar').hidden");
    await evaluate("document.querySelector('[data-note-action=highlight]').click()");
    await delay(200);
    results.overlapNotDuplicated = await evaluate("window.AcademyNotesStore.all().then(notes=>notes.length===1)");
    assert.equal(results.overlapNotDuplicated, true);

    await evaluate(`window.AcademyNotesStore.all().then(notes => {
      const note=notes[0];
      const block=document.querySelector('[data-note-block="'+note.blockId+'"]');
      block.textContent=block.textContent.replace(note.exact,'（这段原文已更新）');
      document.dispatchEvent(new CustomEvent('academy:rendered',{detail:{page:'lesson',id:'J1'}}));
    })`);
    await waitFor("!!document.querySelector('.notes-list-item em')");
    results.changedTextMarkedMissing = await evaluate("document.querySelector('.notes-list-item em').textContent");
    assert.equal(results.changedTextMarkedMissing, '原文位置已变化');

    await evaluate("location.hash='#/final/S1'");
    await waitFor("document.querySelector('[data-note-course-id=\"S1\"]')");
    await delay(150);
    results.crossCourseCount = await evaluate("document.querySelector('[data-notes-count]').textContent");
    results.crossCourseHighlights = await evaluate("document.querySelectorAll('mark.course-note-highlight').length");
    results.finalCodeReadable = await evaluate("document.querySelectorAll('pre[data-note-block] code').length");
    assert.equal(results.crossCourseCount, '0');
    assert.equal(results.crossCourseHighlights, 0);
    assert.equal(results.finalCodeReadable, 3);

    await evaluate("location.hash='#/lesson/J1'");
    await waitFor("document.querySelectorAll('mark.course-note-highlight').length>0");
    results.returnHighlights = await evaluate("document.querySelectorAll('mark.course-note-highlight').length");
    await evaluate(`(() => {
      const label=document.querySelector('#lesson-quiz .options label');
      const walker=document.createTreeWalker(label,NodeFilter.SHOW_TEXT);
      let node,last;
      while((node=walker.nextNode())) last=node;
      const range=document.createRange();
      range.selectNodeContents(last);
      const selection=getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      label.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,button:0}));
    })()`);
    await delay(150);
    results.quizSelectionBlocked = await evaluate("document.getElementById('notes-selection-toolbar').hidden");
    await evaluate("document.querySelector('#lesson-quiz .options input').click()");
    results.quizStillAnswerable = await evaluate("document.querySelector('#lesson-quiz .options input').checked");
    assert.equal(results.quizSelectionBlocked, true);
    assert.equal(results.quizStillAnswerable, true);

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 1, mobile: true
    });
    await evaluate("document.querySelector('[data-notes-open]').click()");
    await delay(250);
    results.mobilePanel = await evaluate(`(() => {
      const rect=document.getElementById('notes-drawer').getBoundingClientRect();
      return {width:Math.round(rect.width),bottom:Math.round(innerHeight-rect.bottom),top:Math.round(rect.top),height:Math.round(rect.height)};
    })()`);
    assert.equal(results.mobilePanel.width, 390);
    assert.equal(results.mobilePanel.bottom, 0);
    assert.ok(results.mobilePanel.height > 500);
    let screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(projectDir, 'notes-mobile-e2e.png'), Buffer.from(screenshot.data, 'base64'));

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
    });
    await delay(200);
    screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(projectDir, 'notes-desktop-e2e.png'), Buffer.from(screenshot.data, 'base64'));

    console.log(JSON.stringify(results, null, 2));
  } finally {
    await client.close();
    await fetch(`${cdpBase}/json/close/${target.id}`, { method: 'GET' }).catch(() => {});
  }
}

await main();
