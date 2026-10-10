/* 問題バンク：問題を選んでプリントを作る */
(function () {
  'use strict';
  const { B, K, L, G, CH, BO, Q, QC, HINT, PASS, KAI, POINT } = Yomi.h;
  const D = Yomi.bank;
  const $ = (id) => document.getElementById(id);

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KNUM = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  function kanji(n) {
    if (n < 10) return KNUM[n];
    const t = Math.floor(n / 10), o = n % 10;
    return (t > 1 ? KNUM[t] : '') + '十' + (o ? KNUM[o] : '');
  }
  function parseKanjiNum(s) {
    if (/^\d+$/.test(s)) return Number(s);
    let n = 0, cur = 0;
    for (const ch of s) {
      if (ch === '百') { n += (cur || 1) * 100; cur = 0; }
      else if (ch === '十') { n += (cur || 1) * 10; cur = 0; }
      else cur = KNUM.indexOf(ch);
    }
    return n + cur;
  }
  /** 設問文から「○字以内」「○字」の字数を読み取る */
  function charLimit(q) {
    const m = String(q).match(/([0-9０-９]+|[一二三四五六七八九十百]+)字(以内|程度|で)?/);
    if (!m) return 0;
    const raw = m[1].replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
    return parseKanjiNum(raw);
  }
  /** 本文：空行で段落、改行で行を分ける。会話文（「で始まる行）は字下げしない */
  function paras(text) {
    return String(text).split(/\n/).map((t) => t.trim()).filter(Boolean)
      .map((t) => (/^[「『（]/.test(t) ? `<span class="noind-line">${esc(t)}</span>` : esc(t)));
  }
  const rowsFor = (ans, base = 1) => Math.min(5, Math.max(base, Math.ceil(String(ans).length / 30)));

  /* ---------- 解答欄 ---------- */
  function answerArea(q, ans) {
    if (q.choices && q.choices.length) return CH(q.choices.map(esc), ans) + `<p class="indent">答え　${K(esc(ans))}</p>`;
    const n = charLimit(q.q);
    if (n && n <= 120) return G(n, ans, n <= 40 ? Math.min(20, n) : 20);
    return L(rowsFor(ans, 2), esc(ans), 0);
  }

  /** 誘導（読み方の手順）→ 再挑戦 */
  function guidedPart(guide, retry, area) {
    const steps = guide.map((g) => {
      const m = String(g).match(/^【([^】]+)】(.*)$/);
      if (m) return `<p class="mt"><b class="gothic">【${esc(m[1])}】</b>${esc(m[2])}</p>`;
      return `<p class="hang mt">${esc(g)}</p>${L(1, '', 70)}`;
    }).join('');
    return HINT(steps, '▼ 読み方の誘導（自力で解いたあとに使う）') +
      `<div class="q"><div class="q-ttl"><span class="q-no">再</span>もう一度、最初の問題を解こう</div><p class="mt">${esc(retry || '最初の問題を、誘導で確かめたことをもとに、もう一度解きなさい。')}</p>${area}</div>`;
  }

  /* ---------- プリントの組み立て ---------- */
  function skillBlocks(p, no, guided) {
    const area = answerArea(p, p.answer);
    const blocks = [
      Q(kanji(no), `${esc(p.skill)}　<span class="small">Level ${p.level}</span>`,
        PASS({ frame: true, paras: paras(p.passage) }) + `<p class="mt"><b class="gothic">問</b>　${esc(p.q)}</p>${area}`),
    ];
    if (guided) blocks.push(guidedPart(p.guide || [], p.retry, answerArea(p, p.answer)));
    return blocks;
  }
  /** 誤答診断：まちがえたら原因に○をつけ、戻る手順を確かめる */
  function diagHTML(skill) {
    const rows = D.diag[skill] || [['A', '根拠不足', '本文の根拠がない', '本文にもどって根拠に線を引く'], ['B', '条件不足', '設問の条件が落ちている', '設問の条件に線を引く'], ['C', '関係ずれ', 'つながりが説明できていない', '関係（理由・変化・対比）を整理する']];
    return `<p class="small mt"><b class="gothic">まちがえたら原因に○</b>　${rows.map((d) => `〔${d[0]}〕${esc(d[1])}：${esc(d[2])}→${esc(d[3])}`).join('　')}</p>`;
  }
  function skillKai(p, no) {
    return KAI(kanji(no), esc(p.answer), `<p>${esc(p.explain || '')}</p>${diagHTML(p.skill)}`, `技能：${esc(p.skill)}`);
  }

  function kaizenBlocks(x, no, guided) {
    const blocks = [
      Q(kanji(no), `答案改善　<span class="small">${esc(x.level)}</span>`,
        PASS({ frame: true, paras: paras(x.passage) }) +
        `<p class="mt"><b class="gothic">設問</b>　${esc(x.question)}</p>` +
        `<p class="mt"><b class="gothic">不十分な答案</b>　<span class="frame" style="display:inline-block">${esc(x.wrong)}</span></p>` +
        `<p class="mt">① この答案に足りない点を説明しなさい。</p>${L(2, esc(x.cause), 0)}` +
        `<p class="mt">② 答案を書き直しなさい。</p>${L(rowsFor(x.answer, 2), esc(x.answer), 0)}`),
    ];
    if (guided) {
      blocks.push(HINT(`<p><b class="gothic">ヒント１</b>　設問で求められた条件と、不十分な答案をくらべましょう。何が書かれていて、何が足りませんか。</p><p class="mt"><b class="gothic">ヒント２</b>　${esc(x.cause)}</p>`, '▼ 解けないときだけ使うヒント'));
    }
    return blocks;
  }
  function kaizenKai(x, no) {
    return KAI(kanji(no), esc(x.answer), `<p>足りない点：${esc(x.cause)}</p>`, `${esc(x.title.replace(/^問\d+\s*/, ''))}`);
  }

  function bigPrint(set, guided, title) {
    let text = esc(set.passage);
    // 設問で「　」として引用された部分に傍線を引く
    set.questions.forEach((q, i) => {
      [...String(q.q).matchAll(/「([^」]{3,40})」/g)].slice(0, 1).forEach((m) => {
        const t = esc(m[1]);
        const at = text.indexOf(t);
        if (at >= 0 && !text.slice(Math.max(0, at - 30), at).includes('class="bo"')) {
          text = text.slice(0, at) + `\u0000${i}\u0001${t}\u0002` + text.slice(at + t.length);
        }
      });
    });
    const lines = text.split(/\n/).map((t) => t.trim()).filter(Boolean).map((t) => {
      t = t.replace(/\u0000(\d+)\u0001([^\u0002]*)\u0002/g, (_, i, s) => BO(s, `問${kanji(Number(i) + 1)}`));
      return /^[「『]/.test(t) ? `<span class="noind-line">${t}</span>` : t;
    });
    const blocks = [PASS({ title: `次の文章を読んで、あとの問いに答えなさい。　〔${esc(set.genre)}〕`, paras: lines })];
    set.questions.forEach((q, i) => {
      const ans = q.choices && q.choices.length ? q.answer : esc(q.answer);
      const area = answerArea(q, ans);
      blocks.push(Q(`問${kanji(i + 1)}`, esc(q.q), area));
      if (guided && q.guide) blocks.push(guidedPart(q.guide, '同じ問いに、もう一度答えなさい。', answerArea(q, ans)));
    });
    const kai = set.questions.map((q, i) => KAI(`問${kanji(i + 1)}`, esc(q.answer), '', `技能：${esc(q.skill)}`));
    const bst = stageOf(Yomi.practice.items.find((x) => x.key === 'big:' + set.id).stages[0]);
    return { id: set.id, chip: `ステージ${bst.label}　長文`, title: `${title}　${esc(set.title)}`, sub: `${esc(set.genre)}・${esc(set.level)}`, levelText: guided ? '自力→誘導→再挑戦' : '自力で解く', blocks, kaisetsu: kai };
  }

  /* ---------- 画面（選ぶ） ---------- */
  const state = { kind: 'skill', chosen: new Set() };
  const keyOf = (kind, id) => `${kind}:${id}`;
  const all = { skill: [], big: [], kaizen: [] };
  Yomi.practice.items.forEach((x) => all[x.kind].push(x));
  const skillOrder = new Map(D.skills.map((s, i) => [s.name, i]));
  all.skill.sort((a, b) => skillOrder.get(a.p.skill) - skillOrder.get(b.p.skill) || a.p.level - b.p.level);
  const stageOf = (no) => Yomi.stages.find((s) => s.no === no);

  function fillFilters() {
    const fs = $('f-skill'), fl = $('f-level');
    if (state.kind === 'skill') {
      // 技能は、選んだステージで出てくるものだけを、ステージ順に並べる
      const st = $('f-stage').value;
      const inStage = all.skill.filter((x) => st === '' || x.stages.includes(Number(st)));
      const names = [...new Set(inStage.map((x) => x.p.skill))];
      const desc = new Map(D.skills.map((s) => [s.name, s.desc]));
      fs.innerHTML = '<option value="">すべての技能</option>' + names.map((n) => `<option value="${esc(n)}">${esc(n)}（${esc(desc.get(n) || '')}）</option>`).join('');
      fl.innerHTML = '<option value="">すべて</option><option value="12">Level 1・2（基礎）</option><option value="34">Level 3・4（発展・入試接続）</option>' + [1, 2, 3, 4].map((n) => `<option value="${n}">Level ${n}${n === 4 ? '（入試接続）' : ''}</option>`).join('');
    } else if (state.kind === 'big') {
      fs.innerHTML = '<option value="">すべて</option><option value="物語">物語</option><option value="説明文">説明文</option>';
      const lv = [...new Set(D.bigsets.map((s) => s.level))];
      fl.innerHTML = '<option value="">すべて</option>' + lv.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join('');
    } else {
      fs.innerHTML = '<option value="">すべて</option>';
      fl.innerHTML = '<option value="">すべて</option><option value="基礎">基礎</option><option value="発展">発展</option>';
    }
    $('f-skill-wrap').firstChild.textContent = state.kind === 'big' ? 'ジャンル' : '技能';
    $('f-skill-wrap').hidden = state.kind === 'kaizen';
  }

  function visible() {
    const s = $('f-skill').value, l = $('f-level').value, q = $('f-q').value.trim(), st = $('f-stage').value;
    return all[state.kind].filter(({ p, stages }) => {
      if (st !== '' && !stages.includes(Number(st))) return false;
      if (state.kind === 'skill') { if (s && p.skill !== s) return false; if (l && !l.split('').includes(String(p.level))) return false; }
      if (state.kind === 'big') { if (s && !p.genre.startsWith(s)) return false; if (l && p.level !== l) return false; }
      if (state.kind === 'kaizen') { if (l && p.level !== l) return false; }
      if (q) {
        const hay = JSON.stringify(p);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function itemHTML({ key, p, stages }) {
    const on = state.chosen.has(key);
    let tags = '', head = '', pv = '';
    const stTags = stages.map((n) => `<span class="tag st">ステージ${stageOf(n).label}</span>`).join('');
    if (state.kind === 'skill') {
      tags = `<span class="tag">${esc(p.skill)}</span><span class="tag">Level ${p.level}</span>`;
      head = esc(p.q);
      pv = `<div class="pv">${esc(p.passage)}</div><div><b>問</b> ${esc(p.q)}</div><div><b>解答例</b> ${esc(p.answer)}</div>`;
    } else if (state.kind === 'big') {
      tags = `<span class="tag">${esc(p.genre)}</span><span class="tag">${esc(p.level)}</span><span class="tag">${p.passage.length}字・${p.questions.length}問</span>`;
      head = esc(p.title);
      pv = `<div class="pv">${esc(p.passage)}</div><ol>${p.questions.map((q) => `<li>${esc(q.q)}</li>`).join('')}</ol>`;
    } else {
      tags = `<span class="tag">答案改善</span><span class="tag">${esc(p.level)}</span>`;
      head = esc(p.title);
      pv = `<div class="pv">${esc(p.passage)}</div><div><b>設問</b> ${esc(p.question)}</div><div><b>不十分な答案</b> ${esc(p.wrong)}</div>`;
    }
    return `<div class="item${on ? ' on' : ''}"><label class="row"><input type="checkbox" data-key="${key}"${on ? ' checked' : ''}><span class="qtext"><span class="meta">${stTags}${tags}</span>${head}</span></label><details><summary>本文と設問を見る</summary>${pv}</details></div>`;
  }

  function renderList() {
    const v = visible();
    $('shown').textContent = `${v.length}件を表示`;
    $('list').innerHTML = v.length ? v.map(itemHTML).join('') : '<div class="empty">条件に合う問題がありません。</div>';
  }
  function updateCount() {
    const c = { skill: 0, big: 0, kaizen: 0 };
    state.chosen.forEach((k) => c[k.split(':')[0]]++);
    $('count').textContent = state.chosen.size;
    const m = document.getElementById('mcount');
    if (m) m.textContent = state.chosen.size;
    $('count-detail').textContent = `技能別 ${c.skill}問・長文大問 ${c.big}題・答案改善 ${c.kaizen}問`;
  }

  $('list').addEventListener('change', (e) => {
    const k = e.target.dataset.key;
    if (!k) return;
    e.target.checked ? state.chosen.add(k) : state.chosen.delete(k);
    e.target.closest('.item').classList.toggle('on', e.target.checked);
    updateCount();
  });
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
    state.kind = b.dataset.kind;
    document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('f-q').value = '';
    fillFilters(); renderList();
  }));
  ['f-skill', 'f-level'].forEach((id) => $(id).addEventListener('change', renderList));
  $('f-stage').addEventListener('change', () => { fillFilters(); renderList(); showStageInfo(); });
  $('f-q').addEventListener('input', renderList);
  $('sel-all').addEventListener('click', () => { visible().forEach((x) => state.chosen.add(x.key)); renderList(); updateCount(); });
  $('sel-clear').addEventListener('click', () => { state.chosen.clear(); renderList(); updateCount(); });
  $('sel-rand').addEventListener('click', () => {
    const v = visible().filter((x) => !state.chosen.has(x.key));
    const n = Math.max(1, Math.min(30, Number($('rand-n').value) || 5));
    for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [v[i], v[j]] = [v[j], v[i]]; }
    v.slice(0, n).forEach((x) => state.chosen.add(x.key));
    renderList(); updateCount();
  });

  /* ---------- プリントを作る ---------- */
  function make() {
    const root = $('sheets');
    root.innerHTML = '';
    const guided = document.querySelector('input[name="mode"]:checked').value === 'guided';
    const opt = { q: $('o-q').checked, a: $('o-a').checked, k: $('o-k').checked };
    const title = esc($('p-title').value.trim() || '読解トレーニング');
    const pick = (kind) => all[kind].filter((x) => state.chosen.has(x.key)).map((x) => x.p);
    const prints = [];

    const blocks = [], kai = [];
    let no = 0;
    pick('skill').forEach((p) => { no++; blocks.push(...skillBlocks(p, no, guided)); kai.push(skillKai(p, no)); });
    pick('kaizen').forEach((x) => { no++; blocks.push(...kaizenBlocks(x, no, guided)); kai.push(kaizenKai(x, no)); });
    // 選んだ問題がすべて同じステージなら、そのステージのルールを最初に載せる
    const chosenItems = Yomi.practice.items.filter((x) => state.chosen.has(x.key));
    const common = Yomi.stages.filter((st) => chosenItems.length && chosenItems.every((x) => x.stages.includes(st.no)));
    const sel = $('f-stage').value;
    const st = common.find((x) => String(x.no) === sel) || common[0];
    const chip = st ? `ステージ${st.label}　練習` : '練習問題';
    const rulesBlock = st && st.rules ? POINT(`ステージ${st.label}のルール　${esc(st.name)}`, st.rules.map((r) => `<p class="hang">・${esc(r)}</p>`).join('')) : '';
    if (blocks.length) {
      if (rulesBlock) blocks.unshift(rulesBlock);
      prints.push({ id: 'bank', chip, title, sub: guided ? 'まず自力で解く → 読み方の誘導で確かめる → もう一度解く' : 'まず自力で解きましょう', levelText: `${no}問`, blocks, kaisetsu: kai });
    }
    pick('big').forEach((set) => prints.push(bigPrint(set, guided, title)));

    if (!prints.length) {
      $('out-bar').hidden = false;
      $('out-info').textContent = '問題が選ばれていません。一覧から選んでください。';
      $('do-print').hidden = true;
      return;
    }
    const bad = [];
    let sheets = 0;
    prints.forEach((p) => {
      const s = Yomi.renderPrint(root, p, opt);
      sheets += s.length;
      if (s.some((x) => x.classList.contains('overflow'))) bad.push(p.title);
    });
    $('out-bar').hidden = false;
    $('do-print').hidden = false;
    $('out-info').textContent = `${sheets}枚のプリントを作りました。`;
    $('out-warn').textContent = bad.length ? `用紙からはみ出している部分があります（赤枠）` : '';
    $('out-bar').scrollIntoView({ behavior: 'smooth' });
    window.dispatchEvent(new Event('resize'));
  }
  $('make').addEventListener('click', make);
  if (document.getElementById('mmake')) document.getElementById('mmake').addEventListener('click', make);
  $('do-print').addEventListener('click', () => window.print());

  function showStageInfo() {
    const v = $('f-stage').value, box = $('stage-info');
    if (v === '') { box.hidden = true; return; }
    const st = stageOf(Number(v));
    const prints = Yomi.byStage(st.no);
    box.hidden = false;
    box.innerHTML = `<p>${esc(st.desc)}</p>` +
      `<div class="learn-links"><b>① 解き方を学ぶプリント</b>${prints.map((p) => `<a href="print.html?id=${p.id}" title="${esc(p.title)}">${p.id} ${esc(p.title.replace(/^練習：/, ''))}</a>`).join('')}</div>`;
  }

  // URL：?stage=4&level=12&kind=skill&mode=guided&auto=5
  (function applyParams() {
    const q = new URLSearchParams(location.search);
    $('f-stage').innerHTML = '<option value="">すべてのステージ</option>' + Yomi.stages.map((s) => `<option value="${s.no}">ステージ${s.label}　${esc(s.name)}（${Yomi.practice.forStage(s.no).length}）</option>`).join('');
    if (q.has('stage')) $('f-stage').value = q.get('stage');
    const kind = q.get('kind');
    if (kind && all[kind]) {
      state.kind = kind;
      document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.kind === kind)));
    }
    fillFilters();
    if (q.has('level')) $('f-level').value = q.get('level');
    if (q.get('mode') === 'guided') document.querySelector('input[name="mode"][value="guided"]').checked = true;
    const st = q.has('stage') ? stageOf(Number(q.get('stage'))) : null;
    if (st) $('p-title').value = `${st.name}の練習`;
    renderList(); updateCount(); showStageInfo();
    const n = Number(q.get('auto'));
    if (n > 0) {
      $('rand-n').value = String(n);
      $('sel-rand').click();
      make();
    }
  })();
  Yomi.bankUI = { make, state, all };
})();
