// In-page editor: "Edit page" makes every text block and member photo editable.
// On this PC, Save writes index.html through server.ps1 and Publish pushes to GitHub.
// On the live GitHub Pages site, Save commits straight to the repository, after unlocking with a GitHub access key.
(function () {
  const LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const REPO = { owner: 'aechan444', name: 'tmtl-portfolio', branch: 'main' };
  const TOKEN_KEY = 'tmtl-gh-token';
  const API = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`;

  const BLOCKS = 'h1, h2, h3, h4, p, li, dt, dd, th, td, blockquote, figcaption';
  const SCOPE = '.hero, main, .footer';
  let editing = false;
  let dirty = false;
  let blocks = [];

  /* ---------- Access key (live site only) ---------- */
  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }
  function setToken(value) {
    try { value ? localStorage.setItem(TOKEN_KEY, value) : localStorage.removeItem(TOKEN_KEY); } catch {}
  }

  async function gh(path, options = {}) {
    const res = await fetch(API + path, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + getToken(),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message; } catch {}
      throw new Error(res.status === 401 ? 'the access key is invalid or expired' : detail || 'GitHub error ' + res.status);
    }
    return res.json();
  }

  async function checkToken() {
    const repo = await gh('');
    if (!repo.permissions || !repo.permissions.push) throw new Error('this key cannot write to ' + REPO.name);
  }

  function bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }

  async function putFile(path, base64, message) {
    let sha;
    try { sha = (await gh('/contents/' + encodeURI(path) + '?ref=' + REPO.branch)).sha; } catch { sha = undefined; }
    return gh('/contents/' + encodeURI(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: base64, branch: REPO.branch, sha }),
    });
  }

  /* ---------- Toolbar ---------- */
  const bar = document.createElement('div');
  bar.id = 'editor-bar';
  bar.className = LOCAL ? 'is-local' : 'is-live';
  bar.innerHTML =
    '<span class="ed-status" id="ed-status" aria-live="polite"></span>' +
    '<button type="button" class="ed-btn ed-primary" id="ed-toggle">✎ Edit page</button>' +
    '<button type="button" class="ed-btn ed-primary" id="ed-save" hidden>Save changes</button>' +
    '<button type="button" class="ed-btn" id="ed-cancel" hidden>Cancel</button>' +
    (LOCAL ? '<button type="button" class="ed-btn ed-publish" id="ed-publish">🚀 Publish to GitHub</button>'
           : '<button type="button" class="ed-btn" id="ed-lock" hidden>Lock</button>') +
    '<input type="file" id="ed-file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>' +
    '<input type="file" id="ed-doc" accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx" hidden>' +
    (LOCAL ? '' :
      '<form class="ed-unlock" id="ed-unlock" hidden>' +
        '<p class="ed-unlock-title">Unlock editing</p>' +
        '<p class="ed-unlock-text">Only Group 4 can edit this page. Paste the GitHub access key for <b>' + REPO.name + '</b>. It stays on this device only.</p>' +
        '<input type="password" id="ed-token" placeholder="github_pat_…" autocomplete="off" aria-label="GitHub access key">' +
        '<div class="ed-unlock-actions">' +
          '<button type="submit" class="ed-btn ed-primary">Unlock</button>' +
          '<button type="button" class="ed-btn" id="ed-unlock-cancel">Cancel</button>' +
        '</div>' +
      '</form>');
  document.body.appendChild(bar);

  const $ = id => document.getElementById(id);
  const fileInput = $('ed-file');
  const docInput = $('ed-doc');
  let imageTarget = null;
  let docTarget = null;
  let addTarget = null;

  // Every link to a document in files/ gets a "Replace" button while editing
  const DOC_LINKS = 'a[href^="files/"]:not([href^="files/MEMBERS"])';
  function addReplaceButtons() {
    document.querySelectorAll(DOC_LINKS).forEach(link => {
      if (link.closest('#editor-bar, .viewer, #chatbot')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ed-replace';
      btn.contentEditable = 'false';
      btn.textContent = '⟳ Replace';
      btn.title = 'Replace this document';
      btn._link = link;
      link.after(btn);
    });
  }
  function removeReplaceButtons() {
    document.querySelectorAll('.ed-replace, .ed-add').forEach(btn => btn.remove());
  }

  // Each module gets an "Add document" button while editing
  function addAddButtons() {
    document.querySelectorAll('.chapter-body').forEach(body => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ed-add';
      btn.textContent = '＋ Add document';
      btn._chapter = body.closest('.chapter');
      body.appendChild(btn);
    });
  }

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
      if (!LOCAL) { addReplaceButtons(); addAddButtons(); }
      status('Click any text to change it. Click a member photo to replace it.' + (LOCAL ? '' : ' Use ⟳ Replace to swap a document.'), '');
    } else {
      blocks.forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('spellcheck'); });
      blocks = [];
      removeReplaceButtons();
    }
    $('ed-toggle').hidden = on;
    $('ed-save').hidden = !on;
    $('ed-cancel').hidden = !on;
    if (!LOCAL) $('ed-lock').hidden = !on;
  }

  async function startEditing() {
    if (LOCAL) { setEditing(true); return; }
    if (getToken()) { setEditing(true); return; }
    $('ed-unlock').hidden = false;
    $('ed-toggle').hidden = true;
    $('ed-token').focus();
  }

  function markDirty() {
    dirty = true;
    status('Unsaved changes', 'warn');
  }

  /* ---------- Edit-mode behavior ---------- */
  // Stop links, PDF previews and the viewer from opening while editing; route photo clicks to the file picker.
  window.addEventListener('click', e => {
    if (!editing || e.target.closest('#editor-bar')) return;
    const replaceBtn = e.target.closest('.ed-replace');
    if (replaceBtn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      docTarget = replaceBtn._link;
      addTarget = null;
      docInput.value = '';
      docInput.click();
      return;
    }
    const addBtn = e.target.closest('.ed-add');
    if (addBtn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      addTarget = addBtn._chapter;
      docTarget = null;
      docInput.value = '';
      docInput.click();
      return;
    }
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

  async function uploadImage(file) {
    if (LOCAL) {
      const res = await fetch('/__upload?name=' + encodeURIComponent(file.name), { method: 'POST', body: file });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()).path;
    }
    if (!/\.(png|jpe?g|webp|gif)$/i.test(file.name)) throw new Error('only PNG, JPG, WEBP or GIF images can be used');
    const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const path = `files/uploads/${stamp}-${file.name.replace(/[^A-Za-z0-9._-]/g, '-')}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await putFile(path, bytesToBase64(bytes), 'Upload photo ' + file.name);
    return path;
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file || !imageTarget) return;
    status('Uploading photo…', '');
    try {
      const path = await uploadImage(file);
      imageTarget.src = LOCAL ? path : URL.createObjectURL(file); // the live copy appears after GitHub rebuilds
      imageTarget.dataset.savedSrc = path;
      markDirty();
    } catch (err) {
      status('Photo upload failed: ' + err.message, 'error');
    }
  });

  /* ---------- Replacing documents (live site) ---------- */
  const extOf = name => (name.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();

  // Add a new document to a module: upload it into files/MODULE N/ and list it in that module
  async function addDocument(file, chapter) {
    const number = parseInt(chapter.querySelector('.chapter-no').textContent, 10);
    const path = `files/MODULE ${number}/${file.name.replace(/[^A-Za-z0-9 ._()-]/g, '-')}`;
    const ext = extOf(file.name);
    const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    status(`Uploading ${file.name}…`, '');
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await putFile(path, bytesToBase64(bytes), `Add ${file.name} to Module ${number}`);

      const body = chapter.querySelector('.chapter-body');
      let list = body.querySelector('.files');
      if (!list) {
        // first document in an empty module: swap the placeholder for a file list
        body.querySelector('.empty-board')?.remove();
        chapter.classList.remove('is-empty');
        list = document.createElement('ul');
        list.className = 'files files-row';
        body.querySelector('.ed-add').before(list);
      }
      const li = document.createElement('li');
      const viewAttrs = ext === 'pdf' ? 'data-view target="_blank" rel="noopener"' : 'download';
      li.innerHTML = `<a class="file" href="${encodeURI(path)}" ${viewAttrs}><i class="b ${ext}">${ext.toUpperCase()}</i><span></span>${ext === 'pdf' ? '' : '<em>↓</em>'}</a>`;
      li.querySelector('span').textContent = title;
      list.appendChild(li);
      li.contentEditable = 'true';
      blocks.push(li);
      markDirty();
      status(`Added ${file.name}. Rename it on the page if you like, then click “Save changes”.`, 'warn');
    } catch (err) {
      status('Could not add the file: ' + err.message, 'error');
    }
  }

  docInput.addEventListener('change', async () => {
    const file = docInput.files[0];
    if (file && addTarget) { await addDocument(file, addTarget); addTarget = null; return; }
    const link = docTarget;
    if (!file || !link) return;
    const oldHref = link.getAttribute('href');
    const oldPath = decodeURIComponent(oldHref);
    const folder = oldPath.slice(0, oldPath.lastIndexOf('/'));
    const sameType = extOf(file.name) === extOf(oldPath);
    // same type: overwrite in place so every link keeps working; otherwise upload beside it under its own name
    const newPath = sameType ? oldPath : `${folder}/${file.name.replace(/[^A-Za-z0-9 ._()-]/g, '-')}`;
    const label = link.textContent.replace(/^(PDF|PPTX|DOCX)/, '').trim();
    status(`Uploading ${file.name}…`, '');
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await putFile(newPath, bytesToBase64(bytes), `Replace ${oldPath.split('/').pop()} with ${file.name}`);
      if (sameType) {
        status(`Replaced “${label}” ✓ The new file is live in about a minute.`, 'ok');
        return;
      }
      // point every link, preview and badge that used the old file at the new one
      const newHref = encodeURI(newPath);
      document.querySelectorAll('[href], [src], [data-src]').forEach(el => {
        for (const attr of ['href', 'src', 'data-src']) {
          const v = el.getAttribute(attr);
          if (v && v.split('#')[0] === oldHref) el.setAttribute(attr, newHref + (v.includes('#') ? v.slice(v.indexOf('#')) : ''));
        }
      });
      const ext = extOf(file.name);
      link.querySelectorAll('i.b').forEach(badge => { badge.textContent = ext.toUpperCase(); badge.className = 'b ' + ext; });
      if (ext === 'pdf') { link.setAttribute('data-view', ''); link.removeAttribute('download'); }
      else { link.removeAttribute('data-view'); link.setAttribute('download', ''); }
      markDirty();
      status(`Uploaded ${file.name}. Click “Save changes” to update the links on the page.`, 'warn');
    } catch (err) {
      status('Could not replace the file: ' + err.message, 'error');
    }
  });

  /* ---------- Saving ---------- */
  function cleanHTML() {
    const doc = document.documentElement.cloneNode(true);
    doc.querySelector('#editor-bar')?.remove();
    doc.querySelector('#chatbot')?.remove();
    doc.querySelectorAll('.ed-replace, .ed-add').forEach(el => el.remove());
    doc.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    doc.querySelectorAll('[spellcheck]').forEach(el => el.removeAttribute('spellcheck'));
    doc.querySelectorAll('img[data-saved-src]').forEach(img => {
      img.setAttribute('src', img.dataset.savedSrc);
      img.removeAttribute('data-saved-src');
    });
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
      if (LOCAL) {
        const res = await fetch('/__save', {
          method: 'POST',
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          body: cleanHTML(),
        });
        if (!res.ok) throw new Error(await res.text());
        dirty = false;
        status('Saved ✓', 'ok');
      } else {
        const html = new TextEncoder().encode(cleanHTML());
        await putFile('index.html', bytesToBase64(html), 'Edit portfolio online (' + new Date().toLocaleString() + ')');
        dirty = false;
        status('Saved to GitHub ✓ The live site updates in about a minute.', 'ok');
      }
    } catch (err) {
      status('Could not save: ' + err.message + (LOCAL ? '. Is "Start Portfolio.bat" running?' : ''), 'error');
    }
  }

  async function publish() {
    if (location.protocol === 'file:') {
      status('Publishing needs the local server. Open the site with "Start Portfolio.bat".', 'error');
      return;
    }
    if (dirty) {
      await save();
      if (dirty) return;
    }
    const btn = $('ed-publish');
    btn.disabled = true;
    status('Publishing to GitHub…', '');
    try {
      const res = await fetch('/__publish', { method: 'POST' });
      const result = await res.json();
      status(result.message, result.ok ? 'ok' : 'error');
    } catch (err) {
      status('Could not publish: ' + err.message + '. Is "Start Portfolio.bat" running?', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------- Wiring ---------- */
  $('ed-toggle').addEventListener('click', startEditing);
  $('ed-save').addEventListener('click', async () => { await save(); if (!dirty) setEditing(false); });
  $('ed-cancel').addEventListener('click', () => {
    if (dirty && !confirm('Discard your unsaved changes?')) return;
    dirty = false;
    location.reload();
  });

  if (LOCAL) {
    $('ed-publish').addEventListener('click', publish);
  } else {
    $('ed-unlock').addEventListener('submit', async e => {
      e.preventDefault();
      const value = $('ed-token').value.trim();
      if (!value) return;
      setToken(value);
      status('Checking key…', '');
      try {
        await checkToken();
        $('ed-token').value = '';
        $('ed-unlock').hidden = true;
        setEditing(true);
      } catch (err) {
        setToken('');
        status('Could not unlock: ' + err.message + '.', 'error');
      }
    });
    $('ed-unlock-cancel').addEventListener('click', () => {
      $('ed-unlock').hidden = true;
      $('ed-toggle').hidden = false;
      status('', '');
    });
    $('ed-lock').addEventListener('click', () => {
      if (dirty && !confirm('Discard your unsaved changes and lock editing?')) return;
      setToken('');
      dirty = false;
      location.reload();
    });
  }

  window.addEventListener('beforeunload', e => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });
})();
