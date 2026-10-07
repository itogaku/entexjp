/* =========================================================
   読解プリント：データ登録・部品（ヘルパー）・レイアウト
   ========================================================= */
(function () {
  'use strict';

  const Yomi = (window.Yomi = {
    stages: [],
    prints: [],
    stage(s) { this.stages.push(s); },
    register(p) { this.prints.push(p); },
    find(id) { return this.prints.find((p) => p.id === id); },
    byStage(no) { return this.prints.filter((p) => p.stage === no).sort(cmpId); },
  });

  function cmpId(a, b) {
    const pa = a.id.split('-').map(Number), pb = b.id.split('-').map(Number);
    return pa[0] - pb[0] || pa[1] - pb[1];
  }
  Yomi.cmpId = cmpId;

  const KANA = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ'];
  const LEVELS = { 1: '★☆☆ 基礎', 2: '★★☆ 標準', 3: '★★★ 発展', 4: '入試レベル' };
  Yomi.LEVELS = LEVELS;
  Yomi.KANA = KANA;

  const esc = (s) => String(s);

  /* ---------------- 部品 ---------------- */
  const h = (Yomi.h = {
    /** （　　）型の書き込み欄。len＝文字数の目安（em） */
    B(len, ans = '', lbl = '') {
      return `<span class="blank" style="inline-size:${len}em">${lbl ? `<span class="lbl">${lbl}</span>` : ''}<span class="a">${esc(ans)}</span></span>`;
    },
    /** 記号を書く□ */
    K(ans = '', wide = false) {
      return `<span class="kbox${wide ? ' kbox-wide' : ''}"><span class="a">${esc(ans)}</span></span>`;
    },
    /** 本文中の空所（Ａ）など */
    S(label, ans = '') {
      return `<span class="slot"><span class="slbl">${label}</span><span class="a">${esc(ans)}</span></span>`;
    },
    /** 書き込み行：cols＝行数、len＝一行の長さ(mm) */
    L(cols, ans = '', len = 0) {
      const size = len ? `inline-size:${len}mm;` : '';
      return `<span class="lines" style="--lh:9mm;block-size:${cols * 9}mm;line-height:9mm;${size}"><span class="a">${esc(ans)}</span></span>`;
    },
    /** 原稿用紙：chars＝マス数、per＝一行のマス数 */
    G(chars, ans = '', per = 20) {
      const cols = Math.ceil(chars / per);
      const ansChars = Array.from(ans);
      let html = '<span class="genko">';
      for (let c = 0; c < cols; c++) {
        const five = (c + 1) % 5 === 0 && c + 1 < cols ? ' five' : '';
        html += `<span class="gc${five}">`;
        for (let r = 0; r < per; r++) {
          const i = c * per + r;
          const ch = i < chars ? ansChars[i] || '' : '';
          const dead = i >= chars ? ' style="background:#ddd"' : '';
          html += `<span class="cell"${dead}><span class="a">${ch}</span></span>`;
        }
        html += '</span>';
      }
      return html + '</span>';
    },
    /** 選択肢。correct＝正解の記号（'イ' など） */
    CH(items, correct = '') {
      const ok = Array.isArray(correct) ? correct : [correct];
      return `<div class="choices">${items
        .map((t, i) => `<div class="${ok.includes(KANA[i]) ? 'correct' : ''}"><span class="ck">${KANA[i]}</span>${t}</div>`)
        .join('')}</div>`;
    },
    /** 傍線（no＝①など） */
    BO(text, no = '') {
      return `${no ? `<span class="bo-no">${no}</span>` : ''}<span class="bo">${text}</span>`;
    },
    BO2(text, no = '') {
      return `${no ? `<span class="bo-no">${no}</span>` : ''}<span class="bo2">${text}</span>`;
    },
    NAMI(text, no = '') {
      return `${no ? `<span class="bo-no">${no}</span>` : ''}<span class="nami">${text}</span>`;
    },
    /** 語群 */
    GO(words, title = '語群') {
      return `<span class="gogun"><span class="gg-ttl">【${title}】</span>${words.join('　')}</span>`;
    },

    /* ---- ブロック ---- */
    AIM(text) { return `<div class="aim">ねらい：${text}</div>`; },
    POINT(title, html) {
      return `<div class="point"><span class="pt-ttl">${title}</span>${html}</div>`;
    },
    RULE(html) { return `<div class="rule">${html}</div>`; },
    EX(html, title = '〈例〉') {
      return `<div class="ex"><span class="ex-ttl">${title}</span>${html}</div>`;
    },
    /** 問題。no＝'一' など */
    Q(no, title, html = '') {
      return `<div class="q"><div class="q-ttl"><span class="q-no">${no}</span>${title}</div>${html}</div>`;
    },
    /** 問題の続き（番号なし） */
    QC(html) { return `<div class="q">${html}</div>`; },
    HINT(html, title = '★ここがポイント★') {
      return `<div class="hint"><span class="h-ttl">${title}</span>${html}</div>`;
    },
    /** 本文。paras＝段落の配列。nums＝段落番号を付けるか */
    PASS({ title = '', paras = [], nums = false, src = '', frame = false, noind = false }) {
      const marks = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
      const body = paras
        .map((p, i) => `<p${noind ? ' class="noind"' : ''}>${nums ? `<span class="pno">${marks[i]}</span>` : ''}${p}</p>`)
        .join('');
      return `<div class="passage${frame ? ' frame' : ''}">${title ? `<div class="ps-ttl">${title}</div>` : ''}${body}${src ? `<p class="src">${src}</p>` : ''}</div>`;
    },
    /** 手順（解き方チェック） */
    STEPS(list) {
      return `<div class="steps">${list
        .map((s, i) => `<span class="st"><span class="st-no">手順${'一二三四五'[i]}</span>${s}</span>`)
        .join('')}</div>`;
    },
    /**
     * 流れ図。items：{lbl, html, ans, h} または {con:'だから'}
     * 右から左へ、箱→つなぎ→箱 と並ぶ。
     */
    FLOW(items, height = 62) {
      const arrow =
        '<svg width="9mm" height="3.5mm" viewBox="0 0 36 14"><path d="M34 7H4M10 1.5 3 7l7 5.5" fill="none" stroke="#1a1a1a" stroke-width="1.8"/></svg>';
      const inner = items
        .map((it) => {
          if (it.con !== undefined) {
            return `<div class="fcon"><span>${it.con}</span>${arrow}${it.back ? `<span>（${it.back}）</span>` : ''}</div>`;
          }
          const body = it.ans !== undefined ? `<span class="a">${it.ans}</span>` : it.html || '';
          return `<div class="fbox${it.ans !== undefined ? ' blankbox' : ''}"${it.w ? ` style="min-block-size:${it.w}mm"` : ''}>${it.lbl ? `<span class="flbl">${it.lbl}</span>` : ''}${body}</div>`;
        })
        .join('');
      return `<div class="flow" style="--fh:${height}mm">${inner}</div>`;
    },
    /** 小問を上下二段にならべる（図の問題で紙面を節約） */
    GRID(cells, cols = 2) {
      return `<div class="qgrid">${cells.map((c) => `<div class="qcell" style="inline-size:calc(${100 / cols}% - 4mm)">${c}</div>`).join('')}</div>`;
    },
    /** 表：rows＝[[セル,...],...]。'#見出し' で始まるセルは th、{ans, len} は書き込み欄 */
    TBL(rows, cls = '') {
      const cell = (c) => {
        if (c && typeof c === 'object') {
          return `<td class="tw" style="inline-size:${c.len || 10}em;min-inline-size:${c.len || 10}em"><span class="a">${c.ans || ''}</span></td>`;
        }
        return String(c).startsWith('#') ? `<th>${String(c).slice(1)}</th>` : `<td>${c}</td>`;
      };
      return `<table class="tbl ${cls}">${rows
        .map((r) => `<tr>${r.map(cell).join('')}</tr>`)
        .join('')}</table>`;
    },
    /** 解説の一項目 */
    KAI(no, ans, html, rule = '') {
      return `<div class="kai"><span class="k-ttl">${no}</span>　<span class="k-ans">${ans}</span>${html}${rule ? `<span class="k-rule">${rule}</span>` : ''}</div>`;
    },
  });

  /* ---------------- レイアウト ---------------- */
  function head(p, kind, cont) {
    const stage = Yomi.stages.find((s) => s.no === p.stage);
    const chip = kind === 'q' ? `ステージ${stage ? stage.label : p.stage}` : kind === 'a' ? '解答' : '解説';
    const fields =
      kind === 'q' && !cont
        ? `<div class="fields"><div class="field date">学習日　　月　　日</div><div class="field name">名前</div>${p.score ? `<div class="field self">得点　　　／${p.score}</div>` : '<div class="field self">自己評価　◎　○　△</div>'}</div>`
        : `<div class="fields"></div>`;
    return `<div class="head${cont ? ' cont' : ''}"><div class="t-left"><span class="stage">${chip}</span><div><div class="ttl">${p.id.replace('-', '－')}　${p.title}</div>${cont ? '' : `<div class="subttl">${p.sub || ''}　<span class="level">${LEVELS[p.level] || ''}</span></div>`}</div></div>${fields}</div>`;
  }

  function newSheet(root, p, kind, cont) {
    const sheet = document.createElement('section');
    sheet.className = 'sheet';
    sheet.innerHTML = `<div class="sheet-body">${head(p, kind, cont)}</div><div class="sheet-foot"></div>`;
    root.appendChild(sheet);
    return sheet;
  }

  // 縦書きでは左方向へのあふれを scrollWidth で検出できないことがあるため、各ブロックの位置で判定する
  const overflows = (body) => {
    const r = body.getBoundingClientRect();
    return Array.from(body.children).some((c) => {
      const b = c.getBoundingClientRect();
      return b.left < r.left - 0.5 || b.bottom > r.bottom + 0.5;
    });
  };

  /** 解答（赤字）が欄からはみ出すときは文字を小さくする */
  function fitAnswers(sheet) {
    sheet.querySelectorAll('.blank > .a, td.tw > .a').forEach((a) => {
      const box = a.parentElement;
      const nowrap = box.classList.contains('blank');
      let fs = parseFloat(getComputedStyle(a).fontSize);
      const limit = () => (nowrap ? a.scrollHeight > box.clientHeight + 1 : a.scrollWidth > box.clientWidth + 1 || a.scrollHeight > box.clientHeight + 1);
      for (let i = 0; i < 12 && fs > 6 && limit(); i++) {
        fs -= 0.5;
        a.style.fontSize = fs + 'px';
      }
    });
  }

  /** blocks を用紙に流し込む。あふれたら次の用紙へ（大きな問題は小問の単位で分ける） */
  function paginate(root, p, kind, blocks) {
    const sheets = [];
    let sheet, body, count;
    const open = (cont) => {
      sheet = newSheet(root, p, kind, cont);
      sheets.push(sheet);
      body = sheet.querySelector('.sheet-body');
      count = 0;
    };
    open(false);

    const place = (node) => {
      body.appendChild(node);
      if (!overflows(body)) { count++; return; }
      if (count === 0) { sheet.classList.add('overflow'); count++; return; }
      node.remove();
      // 子要素が多いブロックは、入るところまでをこの用紙に残し、残りを次の用紙へ
      const kids = Array.from(node.children);
      if (kids.length >= 3) {
        const head = node.cloneNode(false);
        body.appendChild(head);
        let i = 0;
        for (; i < kids.length; i++) {
          head.appendChild(kids[i]);
          if (overflows(body)) { kids[i].remove(); break; }
        }
        if (i >= 2) {
          const rest = node.cloneNode(false);
          kids.slice(i).forEach((k) => rest.appendChild(k));
          open(true);
          place(rest);
          return;
        }
        // 見出しだけが残るようなら、まるごと次へ
        Array.from(head.children).forEach((k) => node.appendChild(k));
        kids.slice(i).forEach((k) => node.appendChild(k));
        head.remove();
      }
      open(true);
      place(node);
    };

    for (const html of blocks) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html.trim();
      Array.from(tmp.children).forEach(place);
    }
    if (kind === 'a') sheets.forEach(fitAnswers);
    const label = kind === 'q' ? '問題' : kind === 'a' ? '解答' : '解説';
    sheets.forEach((s, i) => {
      s.querySelector('.sheet-foot').textContent = `${p.id}　${p.title}　〔${label}〕　${i + 1}／${sheets.length}`;
    });
    return sheets;
  }

  /** プリント一枚分（問題・解答・解説）を描画 */
  Yomi.renderPrint = function (root, p, opt) {
    const out = [];
    if (opt.q) out.push(...paginate(root, p, 'q', p.blocks));
    if (opt.a) {
      const wrap = document.createElement('div');
      wrap.className = 'show-ans';
      root.appendChild(wrap);
      out.push(...paginate(wrap, p, 'a', p.blocks));
    }
    if (opt.k && p.kaisetsu && p.kaisetsu.length) out.push(...paginate(root, p, 'k', p.kaisetsu));
    return out;
  };
})();
