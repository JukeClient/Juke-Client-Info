/* Pre-paint theme bootstrap. IMPORTANT: styles.css must be linked before this
   script in <head>; the --theme-color-* values are read from computed styles.
   Loaded as a blocking script so a saved dark theme is applied before the
   first paint. Kept in one file because it is duplicated on every page;
   changing it must not require touching CSP hashes. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var styles = window.getComputedStyle(root);
  var darkColor = styles.getPropertyValue("--theme-color-dark").trim();
  var lightColor = styles.getPropertyValue("--theme-color-light").trim();
  var saved = null;
  try { saved = localStorage.getItem("juke-site-theme"); } catch (error) {}
  var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var explicit = saved === "dark" || saved === "light";
  var theme = explicit ? saved : (systemDark ? "dark" : "light");
  root.dataset.theme = theme;
  root.dataset.themeMode = explicit ? saved : "system";
  var meta = document.querySelector('meta[name="theme-color"]');
  var color = theme === "dark" ? darkColor : lightColor;
  if (meta && color) meta.content = color;
})();
