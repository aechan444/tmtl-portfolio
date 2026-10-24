// In-page editor: "Edit page" makes every text block and member photo editable; "Save" writes index.html via server.ps1.
(function () {
  // Saving needs server.ps1, so only offer editing on this computer (not on GitHub Pages)
  const LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  if (!LOCAL) return;

  const BLOCKS = 'h1, h2, h3, h4, p, li, dt, dd, th, td, blockquote, figcaption';
  const SCOPE = '.hero, main, .footer';
  let editing = false;
  let dirty = false;
  let blocks = [];

  /* ---------- Toolbar ---------- */
  const bar = document.createElement('div');
  bar.id = 'editor-bar';
  bar.innerHTML =
    '<span class="ed-status" id="ed-status" aria-live="polite"></span>' +
    '<button type="button" class="ed-btn ed-primary" id="ed-toggle">✎ Edit page</button>' +
    '<button type="button" class="ed-btn ed-primary" id="ed-save" hidden>Save changes</button>' +
    '<button type="button" class="ed-btn" id="ed-cancel" hidden>Cancel</button>' +
    '<input type="file" id="ed-file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>';
  document.body.appendChild(bar);

  const $ = id => document.getElementById(id);
  const fileInput = $('ed-file');
  let imageTarget = null;

  function status(msg, kind) {
    const s = $('ed-status');
    s.textContent = msg;
    s.dataset.kind = kind || '';
  }

  /* ---------- Finding editable blocks ---------- */
  function findBlocks() {
    const candidates = [...document.querySelectorAll(BLOCKS)].filter(el =>
      el.closest(SCOPE) &&
      !el.closest('#editor-bar, .viewer, nav, svg') &&
      !el.querySelector('img, iframe, button, canvas'));
    // keep only the outermost block so nested elements are edited as one piece
    return candidates.filter(el => !candidates.some(other => other !== el && other.contains(el)));
  }

  function setEditing(on) {
    if (on && location.protocol === 'file:') {
      status('Editing needs the local server. Open the site with "Start Portfolio.bat".', 'error');
      return;
    }
    editing = on;
    document.body.classList.toggle('editing', on);
    if (on) {
      blocks = findBlocks();
      blocks.forEach(el => { el.contentEditable = 'true'; el.spellcheck = true; });
      status('Click any text to change it. Click a member photo to replace it.', '');
    } else {
      blocks.forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('spellcheck'); });
      blocks = [];
      status('', '');
    }
    $('ed-toggle').hidden = on;
    $('ed-save').hidden = !on;
    $('ed-cancel').hidden = !on;
  }

  function markDirty() {
    dirty = true;
    status('Unsaved changes', 'warn');
  }

  /* ---------- Edit-mode behavior ---------- */
  // Stop links, PDF previews and the viewer from opening while editing; route photo clicks to the file picker.
  window.addEventListener('click', e => {
    if (!editing || e.target.closest('#editor-bar')) return;
    const img = e.target.closest('.polaroid img');
    if (img) {
      e.preventDefault();
      e.stopImmediatePropagation();
      imageTarget = img;
      fileInput.value = '';
      fileInput.click();
      return;
    }
    if (e.target.closest('a, .preview')) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  document.addEventListener('input', e => {
    if (editing && e.target.closest('[contenteditable="true"]')) markDirty();
  });

  // Paste as plain text so formatting from Word or the web doesn't leak in
  document.addEventListener('paste', e => {
    if (!editing || !e.target.closest('[contenteditable="true"]')) return;
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  });

  // Enter would split blocks into stray <div>s; Shift+Enter adds a line break instead
  document.addEventListener('keydown', e => {
    if (editing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      save();
      return;
    }
    if (!editing || e.key !== 'Enter' || !e.target.closest('[contenteditable="true"]')) return;
    e.preventDefault();
    if (e.shiftKey) document.execCommand('insertLineBreak');
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file || !imageTarget) return;
    status('Uploading photo…', '');
    try {
      const res = await fetch('/__upload?name=' + encodeURIComponent(file.name), { method: 'POST', body: file });
      if (!res.ok) throw new Error(await res.text());
      const { path } = await res.json();
      imageTarget.src = path;
      markDirty();
    } catch (err) {
      status('Photo upload failed: ' + err.message, 'error');
    }
  });

  /* ---------- Saving ---------- */
  function cleanHTML() {
    const doc = document.documentElement.cloneNode(true);
    doc.querySelector('#editor-bar')?.remove();
    doc.querySelector('#chatbot')?.remove();
    doc.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    doc.querySelectorAll('[spellcheck]').forEach(el => el.removeAttribute('spellcheck'));
    // undo state that script.js adds at runtime
    doc.classList.remove('js');
    doc.querySelectorAll('.reveal, .in, .scrolled, .active, .editing').forEach(el =>
      el.classList.remove('reveal', 'in', 'scrolled', 'active', 'editing'));
    doc.querySelectorAll('[class=""]').forEach(el => el.removeAttribute('class'));
    if (!doc.getAttribute('class')) doc.removeAttribute('class');
    doc.querySelector('body')?.removeAttribute('style');
    const chalk = doc.querySelector('#chalk');
    if (chalk) { chalk.removeAttribute('width'); chalk.removeAttribute('height'); }
    doc.querySelector('#viewer')?.setAttribute('hidden', '');
    doc.querySelector('#viewer-frame')?.removeAttribute('src');
    const title = doc.querySelector('#viewer-title');
    if (title) title.textContent = '';
    return '<!doctype html>\n' + doc.outerHTML + '\n';
  }

  async function save() {
    status('Saving…', '');
    try {
      const res = await fetch('/__save', {
        method: 'POST',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: cleanHTML(),
      });
      if (!res.ok) throw new Error(await res.text());
      dirty = false;
      status('Saved ✓', 'ok');
    } catch (err) {
      status('Could not save: ' + err.message + '. Is "Start Portfolio.bat" running?', 'error');
    }
  }

  $('ed-toggle').addEventListener('click', () => setEditing(true));
  $('ed-save').addEventListener('click', async () => { await save(); if (!dirty) setEditing(false); });
  $('ed-cancel').addEventListener('click', () => {
    if (dirty && !confirm('Discard your unsaved changes?')) return;
    dirty = false;
    location.reload();
  });

  window.addEventListener('beforeunload', e => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });
})();
