// Applies a stored manual theme before the first paint, so a dark choice does not flash light.
// External file because the CSP allows no inline scripts (architecture §10.3). Mirrors design/theme.tsx.
(function () {
  try {
    var t = localStorage.getItem('rw_theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch {
    // Storage unavailable: the system setting applies.
  }
})();
