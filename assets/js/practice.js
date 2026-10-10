/* 問題バンクの整理
   入門「文章に慣れる」＝技能別のやさしい問題と、答案を直す練習
   仕上げ「入試演習」＝長文の大問 */
(function () {
  'use strict';
  const D = Yomi.bank;

  const items = [
    ...D.problems.map((p) => ({ kind: 'skill', key: 'skill:' + p.id, p })),
    ...D.kaizen.map((p) => ({ kind: 'kaizen', key: 'kaizen:' + p.id, p })),
    ...D.bigsets.map((p) => ({ kind: 'big', key: 'big:' + p.id, p })),
  ];

  /** 技能のまとまり：[{ name, skills: [{name, desc, count}] }] */
  function skillGroups() {
    const count = {};
    D.problems.forEach((p) => { count[p.skill] = (count[p.skill] || 0) + 1; });
    const used = new Set();
    const groups = D.groups.map(([name, from, to]) => {
      const skills = D.skills.slice(from, to).filter((s) => count[s.name]);
      skills.forEach((s) => used.add(s.name));
      return { name, skills };
    });
    // v86 のまとまりに入っていない技能（説明文の組み立てなど）
    let rest = D.skills.filter((s) => count[s.name] && !used.has(s.name));
    // 対比は「文と文の関係」に入れる
    const contrast = rest.find((s) => s.name === '対比');
    if (contrast && groups[1]) { groups[1].skills.push(contrast); rest = rest.filter((s) => s !== contrast); }
    if (rest.length) groups.splice(3, 0, { name: '説明文の組み立てをつかむ', skills: rest });
    groups.forEach((g) => g.skills = g.skills.map((s) => ({ name: s.name, desc: s.desc, count: count[s.name] })));
    return groups;
  }

  Yomi.practice = {
    items,
    skillGroups,
    /** そのステージで学ぶ技能のうち、入門の問題がある技能 */
    skillsForStage(no) {
      const st = Yomi.stages.find((s) => s.no === no);
      const have = new Set(D.problems.map((p) => p.skill));
      return (st && st.skills ? st.skills : []).filter((s) => have.has(s));
    },
  };
})();
