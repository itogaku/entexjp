/* 印刷ページ：?id=1-2 で一枚、?stage=1 でステージまとめて */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const root = document.getElementById('sheets');
  const warn = document.getElementById('tb-warn');
  const opts = { q: document.getElementById('opt-q'), a: document.getElementById('opt-a'), k: document.getElementById('opt-k'), ng: document.getElementById('opt-ng') };

  let prints = [];
  let title = '';
  if (params.has('id')) {
    const p = Yomi.find(params.get('id'));
    if (p) { prints = [p]; title = `${p.id}　${p.title}`; }
  } else if (params.has('drill')) {
    // ?drill=3-2（そのプリントの練習すべて）／?drill=3-2&v=2（一つだけ）／?drill=stage:3（ステージの練習すべて）
    const key = params.get('drill');
    const m = /^stage:(\w+)$/.exec(key);
    let list = m ? Yomi.drillsOfStage(/^\d+$/.test(m[1]) ? Number(m[1]) : m[1]) : Yomi.drillsOf(key);
    if (params.has('v')) list = list.filter((d) => String(d.v) === params.get('v'));
    prints = list.map(Yomi.drillPrint);
    const base = m ? null : Yomi.find(key);
    title = !list.length ? '' : m ? `${({ L: '言葉と文の基礎', K: '古典', G: '文法' })[m[1]] || 'ステージ' + m[1]}　別の問題で練習（まとめて印刷）` : list.length === 1 ? `${key}　${base ? base.title : ''}　練習${Yomi.drillLetter(list[0].v)}` : `${key}　${base ? base.title : ''}　別の文章で練習（${list.length}題）`;
  } else if (params.has('stage')) {
    // 数字はステージ、文字は古典（K）・作文（S）などのまとまり
    const raw = params.get('stage');
    const no = /^\d+$/.test(raw) ? Number(raw) : raw;
    prints = Yomi.byStage(no);
    const s = Yomi.stages.find((x) => x.no === no);
    const NAMES = { L: '言葉と文の基礎', K: '古典　文法と読解', G: '文法　口語文法', J: '漢字・語句', S: '作文', D: '診断テスト' };
    title = s ? `ステージ${s.label}　${s.name}（まとめて印刷）` : NAMES[no] ? `${NAMES[no]}（まとめて印刷）` : '';
  }

  document.getElementById('tb-title').textContent = title || 'プリントが見つかりません';
  if (prints.length && typeof prints[0].stage === 'number') {
    const prac = document.getElementById('tb-prac');
    prac.href = `bank.html?stage=${prints[0].stage}`;
    prac.hidden = false;
  }
  document.title = title ? `${title}｜読解プリント` : '読解プリント';

  /* ---------- 問題を消す ----------
     消したまとまりは URL の ?hide=ID:1.4.k2;ID2:3 に残す（数字は blocks の番号、k つきは解説の番号）。
     問題（一・二…）を消すと、その番号の解答・解説も消し、残りの番号をつけ直す。 */
  const delBox = document.getElementById('opt-del');
  const undoBtn = document.getElementById('btn-undo');
  const hidden = new Map();
  (params.get('hide') || '').split(';').filter(Boolean).forEach((part) => {
    const i = part.lastIndexOf(':');
    if (i > 0) hidden.set(part.slice(0, i), new Set(part.slice(i + 1).split('.').filter(Boolean)));
  });
  const hiddenOf = (id) => hidden.get(id) || new Set();
  function saveHidden() {
    const q = new URLSearchParams(location.search);
    const v = [...hidden].filter(([, set]) => set.size).map(([id, set]) => `${id}:${[...set].join('.')}`).join(';');
    if (v) q.set('hide', v); else q.delete('hide');
    history.replaceState(null, '', `${location.pathname}?${q}`);
    undoBtn.hidden = !v;
  }
  const NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];
  const tag = (html, key) => {
    const t = document.createElement('div');
    t.innerHTML = String(html).trim();
    Array.from(t.children).forEach((c) => c.setAttribute('data-bi', key));
    return t.innerHTML;
  };
  const qNo = (html) => { const m = /<span class="q-no">([^<]*)<\/span>/.exec(html); return m ? m[1] : null; };
  const kNo = (html) => { const m = /^\s*<div class="kai"><span class="k-ttl">([^<]*)<\/span>/.exec(html); return m ? m[1] : null; };
  /** 消したまとまりを除き、番号をつけ直したプリント */
  function edited(p) {
    const hide = hiddenOf(p.id);
    const blocks = p.blocks.map((b, i) => ({ html: b, key: String(i) }));
    const kai = (p.kaisetsu || []).map((b, i) => ({ html: b, key: 'k' + i }));
    const goneNos = new Set(blocks.filter((b) => hide.has(b.key)).map((b) => qNo(b.html)).filter(Boolean));
    const keepB = blocks.filter((b) => !hide.has(b.key));
    const keepK = kai.filter((b) => !hide.has(b.key) && !goneNos.has(kNo(b.html)));
    // 番号が一・二・三…と並んでいるときだけ、つけ直す
    const nos = blocks.map((b) => qNo(b.html)).filter(Boolean);
    const seq = nos.length && nos.every((n, i) => n === NUMS[i]);
    const map = new Map();
    if (seq && goneNos.size) keepB.map((b) => qNo(b.html)).filter(Boolean).forEach((n, i) => map.set(n, NUMS[i]));
    const renum = (html) => !map.size ? html : html
      .replace(/(<span class="q-no">)([^<]*)(<\/span>)/, (m, a, n, c) => a + (map.get(n) || n) + c)
      .replace(/^(\s*<div class="kai"><span class="k-ttl">)([^<]*)(<\/span>)/, (m, a, n, c) => a + (map.get(n) || n) + c);
    return Object.assign({}, p, {
      blocks: keepB.map((b) => tag(renum(b.html), b.key)),
      kaisetsu: keepK.map((b) => tag(renum(b.html), b.key)),
    });
  }
  function addButtons() {
    root.classList.toggle('del-on', delBox.checked);
    if (!delBox.checked) return;
    root.querySelectorAll('.sheet').forEach((sheet) => {
      const id = sheet.dataset.pid;
      const seen = new Set();
      sheet.querySelectorAll('.sheet-body > [data-bi]').forEach((el) => {
        const key = el.getAttribute('data-bi');
        if (seen.has(key)) return; // 用紙をまたいで分かれたまとまりは、最初の部分にだけ
        seen.add(key);
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'del-x';
        x.textContent = '×';
        x.title = 'このまとまりを消す';
        x.addEventListener('click', () => {
          if (!hidden.has(id)) hidden.set(id, new Set());
          hidden.get(id).add(key);
          saveHidden();
          render();
        });
        el.appendChild(x);
      });
    });
  }

  function render() {
    root.innerHTML = '';
    const opt = { q: opts.q.checked, a: opts.a.checked, k: opts.k.checked, noGuide: opts.ng.checked };
    let bad = [];
    prints.forEach((p0) => {
      const p = edited(p0);
      const sheets = Yomi.renderPrint(root, p, opt);
      sheets.forEach((s) => { s.dataset.pid = p0.id; });
      if (sheets.some((s) => s.classList.contains('overflow'))) bad.push(p.id);
    });
    warn.hidden = bad.length === 0;
    warn.textContent = bad.length ? `用紙からはみ出している部分があります（赤枠）：${bad.join('、')}` : '';
    addButtons();
  }
  delBox.addEventListener('change', render);
  undoBtn.addEventListener('click', () => { hidden.clear(); saveHidden(); render(); });
  undoBtn.hidden = !params.get('hide');

  Object.values(opts).forEach((el) => el.addEventListener('change', render));
  document.getElementById('btn-print').addEventListener('click', () => window.print());

  // Google Fonts の日本語フォントは文字ごとに分割されて読み込まれる。
  // 一度描画して必要な文字を読み込ませ、読み込み完了後にもう一度レイアウトし直す。
  async function start() {
    if (!prints.length) {
      root.innerHTML = '<p style="color:#fff;text-align:center">プリントが見つかりません。一覧から選んでください。</p>';
      return;
    }
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    render();
    if (document.fonts && document.fonts.ready) {
      for (let i = 0; i < 3; i++) {
        await Promise.race([document.fonts.ready, wait(5000)]);
        if (document.fonts.status === 'loaded') break;
      }
      render();
    }
    document.body.dataset.ready = '1';
  }
  start();
})();
