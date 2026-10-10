/* 練習問題（問題バンク）とステージを結びつける */
(function () {
  'use strict';
  const D = Yomi.bank;
  const CONTRAST = /違い|対比|比べ|くらべ|対照/;

  /** 技能別の問題が、どのステージの練習になるか */
  function stagesOfProblem(p) {
    const out = new Set();
    const firstLine = String(p.q).split('\n')[0];
    for (const s of Yomi.stages) {
      if (s.skills && s.skills.includes(p.skill)) out.add(s.no);
    }
    // 説明的文章の「文章全体」は、ステージ５（文章の組み立て）で扱う
    if (p.skill === '文章全体' && /筆者/.test(p.passage + p.q)) { out.delete(6); out.add(5); }
    // 対比を問う問題は、ステージ２の練習にもなる
    if (CONTRAST.test(firstLine) && p.skill !== '選択肢照合') out.add(2);
    // やさしい選択肢照合は、ステージ０（選択肢を区切って確かめる）の練習にもなる
    if (p.skill === '選択肢照合' && p.level <= 2) out.add(0);
    return [...out];
  }
  /** 長文大問：標準・発展はジャンル別にステージ５・６、入試レベルはステージ７ */
  function stagesOfBig(set) {
    if (/入試/.test(set.level)) return [7];
    return [/説明/.test(set.genre) ? 5 : 6];
  }

  const items = [
    ...D.problems.map((p) => ({ kind: 'skill', key: 'skill:' + p.id, p, stages: stagesOfProblem(p) })),
    ...D.bigsets.map((p) => ({ kind: 'big', key: 'big:' + p.id, p, stages: stagesOfBig(p) })),
    ...D.kaizen.map((p) => ({ kind: 'kaizen', key: 'kaizen:' + p.id, p, stages: [7] })),
  ];

  Yomi.practice = {
    items,
    forStage(no) { return items.filter((x) => x.stages.includes(no)); },
    /** ステージ別の件数：{ skills: {技能名: 件数}, big: n, kaizen: n } */
    summary(no) {
      const r = { skills: {}, big: 0, kaizen: 0, total: 0 };
      this.forStage(no).forEach((x) => {
        r.total++;
        if (x.kind === 'skill') r.skills[x.p.skill] = (r.skills[x.p.skill] || 0) + 1;
        else r[x.kind]++;
      });
      return r;
    },
  };
})();
