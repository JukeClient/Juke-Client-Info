(function () {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const storageKey = "juke-site-theme";
  const themeSelect = document.querySelector("[data-theme-select]");
  const themeStatus = document.getElementById("theme-status");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  /* styles.css is linked before this script and defines both values. */
  const themeStyles = window.getComputedStyle(root);
  const darkColor = themeStyles.getPropertyValue("--theme-color-dark").trim();
  const lightColor = themeStyles.getPropertyValue("--theme-color-light").trim();
  const colorPreference = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  const motionPreference = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  const screenshotPicture = document.querySelector("[data-screenshot-picture]");
  const screenshotImage = document.querySelector("[data-screenshot]");
  const screenshotSources = screenshotPicture
    ? screenshotPicture.querySelectorAll("[data-screenshot-source]")
    : [];
  let screenshotToken = 0;

  function storedTheme() {
    try {
      const value = localStorage.getItem(storageKey);
      return value === "dark" || value === "light" ? value : null;
    } catch (error) {
      return null;
    }
  }

  function saveTheme(value) {
    try {
      localStorage.setItem(storageKey, value);
    } catch (error) {
      /* Private browsing may block storage; the page still works. */
    }
  }

  function clearTheme() {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      /* No saved choice to remove if storage is blocked. */
    }
  }

  function systemTheme() {
    return colorPreference && colorPreference.matches ? "dark" : "light";
  }

  function resolveTheme(mode) {
    return mode === "dark" || mode === "light" ? mode : systemTheme();
  }

  function announceTheme(theme, mode) {
    if (!themeStatus) return;
    const label = theme === "dark" ? "Dark" : "Light";
    /* There is no visible System option: the select shows the resolved theme. */
    themeStatus.textContent = mode === "system"
      ? "Theme follows system preference: " + label + "."
      : "Theme set to " + label + ".";
  }

  /* The HTML already contains light, dark and PNG fallback sources. With the
     system mode the dark sources follow prefers-color-scheme; an explicit
     choice pins one set by rewriting the media attributes. */
  function updateScreenshot(theme, explicit, animate) {
    if (!screenshotPicture || !screenshotImage || !screenshotSources.length) return;

    const key = theme + "|" + (explicit ? "explicit" : "system");
    if (screenshotImage.dataset.activeTheme === key) return;
    screenshotImage.dataset.activeTheme = key;

    const previousSrc = screenshotImage.currentSrc;
    const wantDark = theme === "dark";
    screenshotSources.forEach(function (source) {
      const isDark = source.getAttribute("data-screenshot-source").indexOf("dark") !== -1;
      if (explicit) {
        source.media = isDark === wantDark ? "all" : "not all";
      } else {
        source.media = isDark ? "(prefers-color-scheme: dark)" : "all";
      }
    });

    if (!animate || (motionPreference && motionPreference.matches)) return;

    const token = ++screenshotToken;

    /* Resetting to "system" can select the same image that was already shown.
       Check currentSrc after the media attributes change so the 1.2 s fade is
       skipped instead of hanging while no load event arrives. */
    function startSwap() {
      if (token !== screenshotToken) return;
      if (screenshotImage.currentSrc === previousSrc) return;

      screenshotImage.classList.add("is-swapping");
      let settled = false;

      /* decode() can resolve for the OLD image if it is called too early.
         Wait for a load event with a changed currentSrc, then decode. */
      function settle() {
        if (settled) return;
        settled = true;
        screenshotImage.removeEventListener("load", onSettled);
        screenshotImage.removeEventListener("error", settle);
        const finish = function () {
          if (token === screenshotToken) screenshotImage.classList.remove("is-swapping");
        };
        if (typeof screenshotImage.decode === "function") {
          screenshotImage.decode().then(finish, finish);
        } else {
          finish();
        }
      }

      function onSettled() {
        if (screenshotImage.currentSrc && screenshotImage.currentSrc === previousSrc) return;
        settle();
      }

      screenshotImage.addEventListener("load", onSettled);
      screenshotImage.addEventListener("error", settle);
      window.setTimeout(settle, 1200);
    }

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(startSwap);
    } else {
      startSwap();
    }
  }

  function applyTheme(theme, mode, animate, announce) {
    root.dataset.theme = theme;
    root.dataset.themeMode = mode;
    const color = theme === "dark" ? darkColor : lightColor;
    if (themeMeta && color) themeMeta.content = color;
    /* With System removed from the options, reflect the resolved theme. */
    if (themeSelect && themeSelect.value !== theme) themeSelect.value = theme;
    updateScreenshot(theme, mode !== "system", animate);
    if (announce) announceTheme(theme, mode);
  }

  const savedMode = storedTheme();
  const initialMode = root.dataset.themeMode === "system" ||
    root.dataset.themeMode === "light" ||
    root.dataset.themeMode === "dark"
    ? root.dataset.themeMode
    : (savedMode || "system");
  applyTheme(resolveTheme(initialMode), initialMode, false, false);

  /* Let the first paint finish before enabling theme transitions. */
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      root.classList.add("theme-ready");
    });
  });

  if (themeSelect) {
    themeSelect.addEventListener("change", function () {
      const mode = themeSelect.value;
      if (mode === "system") {
        clearTheme();
      } else {
        saveTheme(mode);
      }
      applyTheme(resolveTheme(mode), mode, true, true);
    });
  }

  /* S resets to the system choice from anywhere except text inputs. */
  document.addEventListener("keydown", function (event) {
    if (event.key !== "s" && event.key !== "S") return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    const tag = target instanceof Element ? target.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (target instanceof HTMLElement && target.isContentEditable)) return;
    event.preventDefault();
    clearTheme();
    applyTheme(systemTheme(), "system", true, true);
  });

  function onPreferenceChange() {
    if (!storedTheme()) applyTheme(systemTheme(), "system", true, true);
  }
  if (colorPreference) {
    if (colorPreference.addEventListener) {
      colorPreference.addEventListener("change", onPreferenceChange);
    } else if (colorPreference.addListener) {
      colorPreference.addListener(onPreferenceChange);
    }
  }

  window.addEventListener("storage", function (event) {
    if (event.key === storageKey || event.key === null) {
      const mode = storedTheme() || "system";
      applyTheme(resolveTheme(mode), mode, true, true);
    }
  });

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  function closeNav(returnFocus) {
    if (!nav || !navToggle || !nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    if (returnFocus) navToggle.focus();
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });

    nav.addEventListener("click", function (event) {
      if (event.target instanceof Element && event.target.closest("a")) closeNav(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav(true);
    });

    document.addEventListener("pointerdown", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (!(event.target instanceof Element)) return;
      if (nav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 640) closeNav(false);
    });
  }

  const scroller = document.querySelector("[data-social-scroller]");
  const scrollPrev = document.querySelector("[data-scroll-prev]");
  const scrollNext = document.querySelector("[data-scroll-next]");

  function setRailState(button, disabled) {
    if (button) button.setAttribute("aria-disabled", String(disabled));
  }

  function updateRail() {
    if (!scroller) return;
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    /* The scroller has 2px padding and snap alignment, so the resting start
       position is a couple of pixels in. Allow for that before enabling arrows. */
    const atStart = scroller.scrollLeft <= 8;
    const atEnd = scroller.scrollLeft >= maxScroll - 8;
    setRailState(scrollPrev, atStart);
    setRailState(scrollNext, atEnd || maxScroll === 0);
  }

  function scrollRail(direction) {
    if (!scroller) return;
    const button = direction < 0 ? scrollPrev : scrollNext;
    if (button && button.getAttribute("aria-disabled") === "true") return;
    const card = scroller.querySelector(".social-card");
    const amount = card ? card.getBoundingClientRect().width + 12 : scroller.clientWidth * 0.8;
    const behavior = motionPreference && motionPreference.matches ? "auto" : "smooth";
    scroller.scrollBy({ left: direction * amount, behavior: behavior });
  }

  if (scroller) {
    let drag = null;

    function suppressClick() {
      const blockClick = function (event) {
        event.preventDefault();
        event.stopPropagation();
      };
      scroller.addEventListener("click", blockClick, true);
      window.setTimeout(function () {
        scroller.removeEventListener("click", blockClick, true);
      }, 0);
    }

    function cleanupDrag() {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      scroller.classList.remove("is-pointer-down", "is-dragging");
      if (moved) suppressClick();
      updateRail();
    }

    scroller.addEventListener("dragstart", function (event) {
      event.preventDefault();
    });

    scroller.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScroll: scroller.scrollLeft,
        moved: false
      };
      scroller.classList.add("is-pointer-down");
    });

    window.addEventListener("pointermove", function (event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (event.buttons === 0) {
        cleanupDrag();
        return;
      }
      const delta = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(delta) < 4) return;
      if (!drag.moved) {
        drag.moved = true;
        scroller.classList.add("is-dragging");
      }
      scroller.scrollLeft = drag.startScroll - delta;
    });

    window.addEventListener("pointerup", function (event) {
      if (drag && event.pointerId === drag.pointerId) cleanupDrag();
    });
    window.addEventListener("pointercancel", function (event) {
      if (drag && event.pointerId === drag.pointerId) cleanupDrag();
    });
    window.addEventListener("blur", cleanupDrag);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) cleanupDrag();
    });

    scroller.addEventListener("scroll", updateRail, { passive: true });
    window.addEventListener("resize", updateRail);
    updateRail();
  }

  if (scrollPrev) scrollPrev.addEventListener("click", function () { scrollRail(-1); });
  if (scrollNext) scrollNext.addEventListener("click", function () { scrollRail(1); });

  /* Chromium keeps <details> content hidden via content-visibility in print,
     so the only reliable fix is to open them before printing. */
  const faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq-list details"));
  let previousFaqState = [];

  window.addEventListener("beforeprint", function () {
    previousFaqState = faqItems.map(function (item) { return item.open; });
    faqItems.forEach(function (item) { item.open = true; });
  });

  window.addEventListener("afterprint", function () {
    faqItems.forEach(function (item, index) { item.open = previousFaqState[index]; });
  });
})();
