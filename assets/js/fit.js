/* 画面がA4より狭いとき（スマホ・タブレット）、プリントの表示を縮小する。印刷には影響しない */
(function () {
  'use strict';
  const box = document.getElementById('sheets');
  if (!box) return;
  const A4 = 297 * 96 / 25.4; // 297mm を px に
  function fit() {
    const avail = document.documentElement.clientWidth - 16;
    const z = Math.min(1, avail / A4);
    box.style.zoom = z < 0.999 ? String(z) : '';
  }
  window.addEventListener('resize', fit);
  fit();
})();
