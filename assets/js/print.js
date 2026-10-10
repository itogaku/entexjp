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
  } else if (params.has('stage')) {
    const no = Number(params.get('stage'));
    prints = Yomi.byStage(no);
    const s = Yomi.stages.find((x) => x.no === no);
    title = s ? `ステージ${s.label}　${s.name}（まとめて印刷）` : '';
  }

  document.getElementById('tb-title').textContent = title || 'プリントが見つかりません';
  if (prints.length) {
    const prac = document.getElementById('tb-prac');
    prac.href = `bank.html?stage=${prints[0].stage}`;
    prac.hidden = false;
  }
  document.title = title ? `${title}｜読解プリント` : '読解プリント';

  function render() {
    root.innerHTML = '';
    const opt = { q: opts.q.checked, a: opts.a.checked, k: opts.k.checked, noGuide: opts.ng.checked };
    let bad = [];
    prints.forEach((p) => {
      const sheets = Yomi.renderPrint(root, p, opt);
      if (sheets.some((s) => s.classList.contains('overflow'))) bad.push(p.id);
    });
    warn.hidden = bad.length === 0;
    warn.textContent = bad.length ? `用紙からはみ出している部分があります（赤枠）：${bad.join('、')}` : '';
  }

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
