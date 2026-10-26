/* 別の文章で練習（ドリル）
   解き方プリント（base）と同じ手順・同じ形の問いを、別の文章で何度でも練習する。
   データ：Yomi.drill({ base: '3-2', v: 1, title, genre, passage: [段落...], nums, point: [手順...],
     qs: [{ q, type: 'choice'|'write'|'extract'|'short'|'mark', choices, answer, n, explain }] })
   ・本文の「{{ことば|①}}」は傍線（①は記号）。
   ・write＝記述（n＝字数。答えはその八割以上）、extract＝抜き出し（n＝字数ぴったり）、
     short＝短い語句、mark＝記号だけを書く（選択肢は問いの中に書く）、choice＝ア〜エを選ぶ。 */
(function () {
  'use strict';
  Yomi.drills = [];
  Yomi.drill = (d) => Yomi.drills.push(d);

  const LETTERS = 'ＡＢＣＤＥＦＧＨ';
  const NUM = '〇一二三四五六七八九';
  const kanji = (n) => (n <= 10 ? ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][n] : '十' + NUM[n - 10]);
  Yomi.drillLetter = (v) => LETTERS[v - 1] || String(v);

  /** あるプリント（または、あるステージ）の練習 */
  Yomi.drillsOf = (base) => Yomi.drills.filter((d) => d.base === base).sort((a, b) => a.v - b.v);
  Yomi.drillsOfStage = (no) => Yomi.drills.filter((d) => { const p = Yomi.find(d.base); return p && p.stage === no; })
    .sort((a, b) => Yomi.cmpId(Yomi.find(a.base), Yomi.find(b.base)) || a.v - b.v);

  function area(q) {
    const { CH, G, B, K } = Yomi.h;
    const ans = String(q.answer);
    if (q.type === 'choice') return CH(q.choices, ans);
    if (q.type === 'mark') return `<p class="indent mt">答え　${K(ans)}</p>`;
    if (q.type === 'write' || q.type === 'extract') {
      const n = q.n || Array.from(ans).length;
      return G(n, ans, n <= 40 ? Math.min(20, n) : 20);
    }
    return `<p class="indent mt">${B(Math.max(4, Array.from(ans).length + 2), ans)}</p>`;
  }

  /** ドリル一つ分のプリント（renderPrint に渡す形） */
  Yomi.drillPrint = (d) => {
    const { AIM, POINT, STEPS, PASS, Q, KAI, BO } = Yomi.h;
    const base = Yomi.find(d.base) || { title: d.base, stage: '', level: 2 };
    const mark = (t) => String(t).replace(/\{\{([^|}]+)\|([^}]*)\}\}/g, (_, s, l) => BO(s, l));
    const blocks = [
      AIM(`「${base.title}」で学んだ解き方を、別の文章で使います。手順どおりに解いてから、答え合わせをしましょう。`),
    ];
    if (d.point && d.point.length) blocks.push(POINT('解き方の手順', STEPS(d.point)));
    blocks.push(PASS({ title: `【${d.genre || '文章'}】${d.title || ''}`, nums: !!d.nums, paras: d.passage.map(mark) }));
    d.qs.forEach((q, i) => blocks.push(Q(kanji(i + 1), mark(q.q), area(q))));
    const kaisetsu = d.qs.map((q, i) => KAI(kanji(i + 1), String(q.answer), q.explain ? `<p>${q.explain}</p>` : ''));
    return {
      id: `${d.base}・${LETTERS[d.v - 1] || d.v}`,
      stage: base.stage,
      level: base.level,
      chip: '別の文章で練習',
      title: `${d.base}　${base.title}　練習${LETTERS[d.v - 1] || d.v}`,
      sub: d.title || '',
      blocks,
      kaisetsu,
    };
  };
})();
