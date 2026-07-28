(function () {
  'use strict';

  const store = window.AcademyNotesStore;
  if (!store) return;

  const state = {
    notes: [],
    context: null,
    pendingSelection: null,
    activeId: null,
    filter: 'current',
    renderToken: 0,
    scrollToId: null,
    panelOpen: false
  };

  const esc = value => String(value == null ? '' : value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));

  function toast(message, type) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const element = document.createElement('div');
    element.className = `toast ${type || ''}`;
    element.textContent = message;
    root.appendChild(element);
    setTimeout(() => element.remove(), 2600);
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `note-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function ensureUi() {
    if (!document.getElementById('notes-selection-toolbar')) {
      const toolbar = document.createElement('div');
      toolbar.id = 'notes-selection-toolbar';
      toolbar.className = 'notes-selection-toolbar';
      toolbar.setAttribute('role', 'toolbar');
      toolbar.setAttribute('aria-label', '文字划线工具');
      toolbar.hidden = true;
      toolbar.innerHTML = '<button type="button" data-note-action="highlight">划线</button><button type="button" data-note-action="thought">写想法</button><button type="button" data-note-action="cancel">取消</button>';
      document.body.appendChild(toolbar);
    }
    if (!document.getElementById('notes-drawer')) {
      const drawer = document.createElement('aside');
      drawer.id = 'notes-drawer';
      drawer.className = 'notes-drawer';
      drawer.setAttribute('aria-label', '我的笔记');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(drawer);
    }
  }

  function currentContext() {
    const scope = document.querySelector('[data-note-course-id]');
    if (!scope) return null;
    return {
      courseId: scope.dataset.noteCourseId,
      courseTitle: scope.dataset.noteCourseTitle,
      route: scope.dataset.noteRoute
    };
  }

  function visibleNotes() {
    if (state.filter === 'current' && state.context) {
      return state.notes.filter(note => note.courseId === state.context.courseId);
    }
    return state.notes;
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  function renderDrawer() {
    const drawer = document.getElementById('notes-drawer');
    if (!drawer) return;
    const notes = visibleNotes();
    const active = state.notes.find(note => note.id === state.activeId);
    const currentLabel = state.context ? `当前课 ${state.notes.filter(note => note.courseId === state.context.courseId).length}` : '当前课';
    drawer.innerHTML = `
      <div class="notes-drawer-head">
        <div><span>本地阅读笔记</span><strong>我的笔记</strong></div>
        <button type="button" class="notes-close" data-notes-close aria-label="关闭我的笔记">×</button>
      </div>
      <p class="notes-local-hint">笔记只保存在这台设备的这个浏览器里，清理浏览器数据会丢失。</p>
      <div class="notes-tabs" role="tablist" aria-label="笔记范围">
        <button type="button" role="tab" data-notes-filter="current" ${!state.context ? 'disabled' : ''} aria-selected="${state.filter === 'current'}" class="${state.filter === 'current' ? 'active' : ''}">${esc(currentLabel)}</button>
        <button type="button" role="tab" data-notes-filter="all" aria-selected="${state.filter === 'all'}" class="${state.filter === 'all' ? 'active' : ''}">全部笔记 ${state.notes.length}</button>
      </div>
      <div class="notes-list" aria-label="笔记列表">
        ${notes.length ? notes.map(note => noteListItem(note)).join('') : '<div class="notes-empty"><strong>还没有笔记</strong><p>在课程正文中选中文字，就能划线或写想法。</p></div>'}
      </div>
      ${active ? noteEditor(active) : ''}
      <div class="notes-backup-actions">
        <button type="button" data-notes-export ${state.notes.length ? '' : 'disabled'}>导出笔记</button>
        <button type="button" data-notes-import>导入笔记</button>
        <input type="file" id="notes-import-file" accept="application/json,.json" hidden>
      </div>`;
    drawer.classList.toggle('open', state.panelOpen);
    drawer.setAttribute('aria-hidden', String(!state.panelOpen));
    document.body.classList.toggle('notes-panel-open', state.panelOpen);
    if (active && state.panelOpen) {
      const textarea = drawer.querySelector('#note-thought');
      if (textarea) textarea.focus({ preventScroll: true });
    }
  }

  function noteListItem(note) {
    const isCurrent = state.context && note.courseId === state.context.courseId;
    const missing = isCurrent && !resolveNoteInDocument(note);
    return `<article class="notes-list-item ${state.activeId === note.id ? 'active' : ''}">
      <button type="button" data-note-open="${esc(note.id)}">
        <q>${esc(note.exact)}</q>
        ${note.thought ? `<p>${esc(note.thought)}</p>` : '<p class="notes-no-thought">只有划线，暂未写想法</p>'}
        <span>${esc(note.courseTitle)} · ${esc(formatTime(note.updatedAt))}</span>
        ${missing ? '<em>原文位置已变化</em>' : ''}
      </button>
    </article>`;
  }

  function noteEditor(note) {
    return `<section class="notes-editor" aria-label="编辑笔记">
      <button type="button" class="notes-editor-back" data-note-editor-close>← 返回列表</button>
      <blockquote>${esc(note.exact)}</blockquote>
      <label for="note-thought">我的想法</label>
      <textarea id="note-thought" rows="6" maxlength="100000" placeholder="写下此刻的理解、疑问或例子…">${esc(note.thought)}</textarea>
      <div class="notes-editor-actions">
        <button type="button" class="primary" data-note-save="${esc(note.id)}">保存想法</button>
        <button type="button" data-note-remove-thought="${esc(note.id)}">删除想法，保留划线</button>
        <button type="button" class="danger" data-note-delete="${esc(note.id)}">彻底删除这条划线</button>
      </div>
    </section>`;
  }

  function updateHeaderCount() {
    const count = state.context
      ? state.notes.filter(note => note.courseId === state.context.courseId).length
      : state.notes.length;
    document.querySelectorAll('[data-notes-count]').forEach(element => { element.textContent = String(count); });
  }

  function textNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.length) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && node.parentElement.closest('.notes-drawer,.notes-selection-toolbar')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  }

  function rangeOffsets(block, range) {
    let cursor = 0;
    let start = null;
    let end = null;
    for (const node of textNodes(block)) {
      const next = cursor + node.nodeValue.length;
      if (node === range.startContainer) start = cursor + range.startOffset;
      if (node === range.endContainer) end = cursor + range.endOffset;
      cursor = next;
    }
    if (start == null || end == null || end <= start) return null;
    return { start, end, text: block.textContent || '' };
  }

  function resolveAnchor(text, note) {
    if (!note.exact) return null;
    const candidates = [];
    let index = text.indexOf(note.exact);
    while (index !== -1) {
      const prefix = text.slice(Math.max(0, index - note.prefix.length), index);
      const suffix = text.slice(index + note.exact.length, index + note.exact.length + note.suffix.length);
      let contextScore = 0;
      if (note.prefix && prefix === note.prefix) contextScore += 2;
      if (note.suffix && suffix === note.suffix) contextScore += 2;
      const distance = Math.abs(index - Number(note.startHint || 0));
      candidates.push({ start: index, end: index + note.exact.length, contextScore, distance });
      index = text.indexOf(note.exact, index + 1);
    }
    if (!candidates.length) return null;
    if (candidates.length === 1) return candidates[0];
    candidates.sort((a, b) => b.contextScore - a.contextScore || a.distance - b.distance);
    if (candidates[0].contextScore === 0 && candidates[0].distance > 4) return null;
    if (candidates[1] && candidates[0].contextScore === candidates[1].contextScore && candidates[0].distance === candidates[1].distance) return null;
    return candidates[0];
  }

  function resolveNoteInDocument(note) {
    const block = document.querySelector(`[data-note-block="${window.CSS && CSS.escape ? CSS.escape(note.blockId) : note.blockId.replace(/"/g, '\\"')}"]`);
    if (!block) return null;
    const anchor = resolveAnchor(block.textContent || '', note);
    return anchor ? { block, anchor } : null;
  }

  function unwrapHighlights() {
    document.querySelectorAll('mark.course-note-highlight').forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      mark.remove();
      parent.normalize();
    });
  }

  function wrapTextRange(block, start, end, noteId) {
    let cursor = 0;
    const parts = [];
    for (const node of textNodes(block)) {
      const nodeStart = cursor;
      const nodeEnd = cursor + node.nodeValue.length;
      const from = Math.max(start, nodeStart);
      const to = Math.min(end, nodeEnd);
      if (to > from && !(node.parentElement && node.parentElement.closest('mark.course-note-highlight'))) {
        parts.push({ node, start: from - nodeStart, end: to - nodeStart });
      }
      cursor = nodeEnd;
    }
    parts.reverse().forEach(part => {
      let selected = part.node;
      if (part.end < selected.nodeValue.length) selected.splitText(part.end);
      if (part.start > 0) selected = selected.splitText(part.start);
      const mark = document.createElement('mark');
      mark.className = 'course-note-highlight';
      mark.dataset.noteId = noteId;
      mark.tabIndex = 0;
      mark.setAttribute('role', 'button');
      mark.setAttribute('aria-label', '打开这条笔记');
      selected.parentNode.insertBefore(mark, selected);
      mark.appendChild(selected);
    });
  }

  function renderHighlights() {
    unwrapHighlights();
    const context = state.context;
    if (!context) return;
    state.notes
      .filter(note => note.courseId === context.courseId)
      .map(note => ({ note, resolved: resolveNoteInDocument(note) }))
      .filter(item => item.resolved)
      .sort((a, b) => b.resolved.anchor.start - a.resolved.anchor.start)
      .forEach(item => wrapTextRange(
        item.resolved.block,
        item.resolved.anchor.start,
        item.resolved.anchor.end,
        item.note.id
      ));
  }

  async function refresh() {
    ensureUi();
    const token = ++state.renderToken;
    state.context = currentContext();
    if (!state.context && state.filter === 'current') state.filter = 'all';
    try {
      const notes = await store.all();
      if (token !== state.renderToken) return;
      state.notes = notes;
      renderHighlights();
      updateHeaderCount();
      renderDrawer();
      if (state.scrollToId) {
        const id = state.scrollToId;
        state.scrollToId = null;
        requestAnimationFrame(() => scrollToNote(id));
      }
    } catch (error) {
      toast(error.message || '本地笔记暂时不可用', 'error');
    }
  }

  function selectionSnapshot() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    const startElement = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
    const endElement = range.endContainer.nodeType === Node.TEXT_NODE ? range.endContainer.parentElement : range.endContainer;
    if (!startElement || !endElement || startElement.closest('.notes-drawer,.notes-selection-toolbar') || endElement.closest('.notes-drawer,.notes-selection-toolbar')) return null;
    if (startElement.closest('button,input,textarea,select,option,label,form,.options,.memory-card,.problem-list') ||
        endElement.closest('button,input,textarea,select,option,label,form,.options,.memory-card,.problem-list')) return null;
    const startBlock = startElement.closest('[data-note-block]');
    const endBlock = endElement.closest('[data-note-block]');
    if (!startBlock || startBlock !== endBlock) return null;
    const scope = startBlock.closest('[data-note-course-id]');
    if (!scope) return null;
    const offsets = rangeOffsets(startBlock, range);
    if (!offsets) return null;
    const exact = offsets.text.slice(offsets.start, offsets.end);
    if (exact.trim().length < 2) return null;
    return {
      courseId: scope.dataset.noteCourseId,
      courseTitle: scope.dataset.noteCourseTitle,
      route: scope.dataset.noteRoute,
      blockId: startBlock.dataset.noteBlock,
      exact,
      prefix: offsets.text.slice(Math.max(0, offsets.start - 48), offsets.start),
      suffix: offsets.text.slice(offsets.end, offsets.end + 48),
      startHint: offsets.start,
      endHint: offsets.end,
      rect: range.getBoundingClientRect()
    };
  }

  function showSelectionToolbar() {
    const snapshot = selectionSnapshot();
    const toolbar = document.getElementById('notes-selection-toolbar');
    if (!snapshot || !toolbar) {
      hideSelectionToolbar();
      return;
    }
    state.pendingSelection = snapshot;
    toolbar.hidden = false;
    const width = toolbar.offsetWidth || 210;
    const left = Math.max(8, Math.min(window.innerWidth - width - 8, snapshot.rect.left + snapshot.rect.width / 2 - width / 2));
    const top = Math.max(8, snapshot.rect.top - 48);
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  }

  function hideSelectionToolbar() {
    const toolbar = document.getElementById('notes-selection-toolbar');
    if (toolbar) toolbar.hidden = true;
    state.pendingSelection = null;
  }

  function existingOverlap(snapshot) {
    return state.notes.find(note => {
      if (note.courseId !== snapshot.courseId || note.blockId !== snapshot.blockId) return false;
      const block = document.querySelector(`[data-note-block="${CSS.escape(note.blockId)}"]`);
      if (!block) return false;
      const anchor = resolveAnchor(block.textContent || '', note);
      return anchor && snapshot.startHint < anchor.end && snapshot.endHint > anchor.start;
    });
  }

  async function createFromSelection(openEditor) {
    const snapshot = state.pendingSelection;
    if (!snapshot) return;
    const overlap = existingOverlap(snapshot);
    hideSelectionToolbar();
    window.getSelection().removeAllRanges();
    if (overlap) {
      state.activeId = overlap.id;
      state.panelOpen = true;
      renderDrawer();
      toast('这段已划线，已打开原笔记');
      return;
    }
    const now = Date.now();
    const note = Object.assign({}, snapshot, {
      id: makeId(),
      thought: '',
      createdAt: now,
      updatedAt: now
    });
    delete note.rect;
    await store.put(note);
    state.activeId = openEditor ? note.id : null;
    state.panelOpen = Boolean(openEditor);
    await refresh();
    toast(openEditor ? '已划线，可以写想法了' : '已保存划线', 'success');
  }

  function openPanel() {
    state.context = currentContext();
    state.filter = state.context ? 'current' : 'all';
    state.panelOpen = true;
    state.activeId = null;
    renderDrawer();
  }

  function closePanel() {
    state.panelOpen = false;
    state.activeId = null;
    renderDrawer();
  }

  function scrollToNote(id) {
    const marks = document.querySelectorAll(`mark[data-note-id="${CSS.escape(id)}"]`);
    if (!marks.length) {
      toast('原文位置已变化，已保留笔记内容', 'error');
      return;
    }
    marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    marks.forEach(mark => {
      mark.classList.add('flash');
      setTimeout(() => mark.classList.remove('flash'), 1500);
    });
  }

  function openNote(id, navigate) {
    const note = state.notes.find(item => item.id === id);
    if (!note) return;
    state.activeId = id;
    state.panelOpen = true;
    if (navigate && (!state.context || state.context.courseId !== note.courseId)) {
      state.scrollToId = id;
      location.hash = `#/${note.route.replace(/^#?\//, '')}`;
      return;
    }
    renderDrawer();
    if (navigate) scrollToNote(id);
  }

  async function saveThought(id, thought) {
    const note = await store.get(id);
    if (!note) return;
    note.thought = thought;
    note.updatedAt = Date.now();
    await store.put(note);
    await refresh();
    state.activeId = id;
    state.panelOpen = true;
    renderDrawer();
    toast('想法已保存', 'success');
  }

  async function deleteNote(id) {
    await store.remove(id);
    state.activeId = null;
    await refresh();
    toast('划线和想法已删除');
  }

  function exportNotes() {
    const payload = store.exportPayload(state.notes);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xiaoturing-notes-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importFile(file) {
    if (!file || file.size > 10 * 1024 * 1024) throw new Error('导入文件过大或未选择文件');
    let payload;
    try {
      payload = JSON.parse(await file.text());
    } catch (_) {
      throw new Error('导入文件不是有效的 JSON');
    }
    const result = await store.importPayload(payload);
    await refresh();
    toast(result.added ? `已导入 ${result.added} 条笔记，跳过 ${result.skipped} 条重复` : '没有新增笔记，现有内容未改变', 'success');
  }

  document.addEventListener('academy:rendered', refresh);
  document.addEventListener('mouseup', event => {
    if (event.button !== 0 || event.target.closest('.notes-selection-toolbar,.notes-drawer')) return;
    setTimeout(showSelectionToolbar, 0);
  });
  document.addEventListener('touchend', event => {
    if (event.target.closest('.notes-selection-toolbar,.notes-drawer')) return;
    setTimeout(showSelectionToolbar, 120);
  }, { passive: true });
  window.addEventListener('scroll', hideSelectionToolbar, { passive: true });
  window.addEventListener('resize', hideSelectionToolbar, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const toolbar = document.getElementById('notes-selection-toolbar');
      if (toolbar && !toolbar.hidden) hideSelectionToolbar();
      else if (state.panelOpen) closePanel();
    }
    const mark = event.target.closest && event.target.closest('mark[data-note-id]');
    if (mark && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openNote(mark.dataset.noteId, false);
    }
  });
  document.addEventListener('click', async event => {
    const action = event.target.closest('[data-note-action]');
    if (action) {
      event.stopPropagation();
      if (action.dataset.noteAction === 'highlight') await createFromSelection(false);
      if (action.dataset.noteAction === 'thought') await createFromSelection(true);
      if (action.dataset.noteAction === 'cancel') hideSelectionToolbar();
      return;
    }
    const mark = event.target.closest('mark[data-note-id]');
    if (mark) {
      event.preventDefault();
      event.stopPropagation();
      openNote(mark.dataset.noteId, false);
      return;
    }
    if (event.target.closest('[data-notes-open]')) return openPanel();
    if (event.target.closest('[data-notes-close]')) return closePanel();
    const filter = event.target.closest('[data-notes-filter]');
    if (filter && !filter.disabled) {
      state.filter = filter.dataset.notesFilter;
      state.activeId = null;
      return renderDrawer();
    }
    const open = event.target.closest('[data-note-open]');
    if (open) return openNote(open.dataset.noteOpen, true);
    if (event.target.closest('[data-note-editor-close]')) {
      state.activeId = null;
      return renderDrawer();
    }
    const save = event.target.closest('[data-note-save]');
    if (save) return saveThought(save.dataset.noteSave, document.getElementById('note-thought').value);
    const removeThought = event.target.closest('[data-note-remove-thought]');
    if (removeThought) return saveThought(removeThought.dataset.noteRemoveThought, '');
    const removeNote = event.target.closest('[data-note-delete]');
    if (removeNote) return deleteNote(removeNote.dataset.noteDelete);
    if (event.target.closest('[data-notes-export]')) return exportNotes();
    if (event.target.closest('[data-notes-import]')) return document.getElementById('notes-import-file').click();
    if (!event.target.closest('.notes-selection-toolbar')) hideSelectionToolbar();
  });
  document.addEventListener('change', async event => {
    if (event.target.id !== 'notes-import-file') return;
    try {
      await importFile(event.target.files[0]);
    } catch (error) {
      toast(error.message || '导入失败，原笔记未改变', 'error');
    } finally {
      event.target.value = '';
    }
  });

  window.AcademyNotesTest = { resolveAnchor };
  ensureUi();
})();
