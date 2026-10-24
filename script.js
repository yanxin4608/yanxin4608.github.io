(function () {
  /* Theme: follows the system until the visitor explicitly picks light or dark */
  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');
  var meta = document.getElementById('themeColor');
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function effective() {
    var saved = root.getAttribute('data-theme');
    if (saved) return saved;
    return media.matches ? 'dark' : 'light';
  }

  function applyTheme() {
    var t = effective();
    if (toggle) toggle.setAttribute('data-theme', t);
    if (meta) meta.setAttribute('content', t === 'dark' ? '#171716' : '#ECEAE6');
  }

  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = effective() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      applyTheme();
    });
  }

  if (media.addEventListener) media.addEventListener('change', applyTheme);
  else if (media.addListener) media.addListener(applyTheme);
  applyTheme();
})();
