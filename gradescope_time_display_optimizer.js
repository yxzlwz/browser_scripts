// ==UserScript==
// @name         Gradescope Time Display Optimizer
// @version      1.0
// @namespace    https://github.com/yxzlwz/browser_scripts
// @updateURL    https://raw.githubusercontent.com/yxzlwz/browser_scripts/master/gradescope_time_display_optimizer.js
// @downloadURL  https://raw.githubusercontent.com/yxzlwz/browser_scripts/master/gradescope_time_display_optimizer.js
// @description  Convert common 12-hour time text on webpages to 24-hour format
// @match        https://*.gradescope.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  const TIME_SELECTOR = [
    'time.submissionTimeChart--dueDate[datetime]',
    'time.submissionTimeChart--releaseDate[datetime]'
  ].join(',');

  const HEADER_ABBR_SELECTOR = [
    'th[aria-label*="Release and due date"] abbr',
    'th[aria-label*="Eastern Time"] abbr',
    'abbr[title="Eastern Time (US & Canada)"]',
    'abbr[title="Eastern Time (US &amp; Canada)"]'
  ].join(',');

  const STYLE_ID = 'gradescope-local-time-style';
  const STORAGE_KEY = 'gradescopeLocalTime.showTimezone';

  function getStoredShowTimezone() {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === null ? true : value === 'true';
  }

  function setStoredShowTimezone(show) {
    localStorage.setItem(STORAGE_KEY, String(show));
  }

  function applyTimezoneVisibility() {
    document.documentElement.classList.toggle(
      'gs-local-time-hide-zone',
      !getStoredShowTimezone()
    );
  }

  function toggleTimezoneVisibility() {
    const next = !getStoredShowTimezone();
    setStoredShowTimezone(next);
    applyTimezoneVisibility();
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      time.gs-local-time {
        display: inline-flex;
        align-items: baseline;
        gap: 0.35em;
        white-space: nowrap;
        cursor: pointer;
      }

      .gs-local-time-main {
        white-space: nowrap;
      }

      .gs-local-time-dot {
        opacity: 0.45;
        font-size: 1em;
        font-weight: inherit;
      }

      .gs-local-time-zone {
        font-size: 1em;
        font-weight: inherit;
        opacity: 0.68;
        white-space: nowrap;
      }

      .gs-local-time-hide-zone .gs-local-time-dot,
      .gs-local-time-hide-zone .gs-local-time-zone {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  function parseGradescopeDatetime(value) {
    const match = value.trim().match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+([+-]\d{2})(\d{2})$/
    );

    if (!match) return null;

    const [, y, mo, d, h, mi, s = '00', offsetHour, offsetMin] = match;
    const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${offsetHour}:${offsetMin}`;
    const date = new Date(iso);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getGMTOffsetLabel(date = new Date()) {
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const hours = Math.floor(abs / 60);
    const minutes = abs % 60;

    if (minutes === 0) {
      return `GMT${sign}${hours}`;
    }

    return `GMT${sign}${hours}:${String(minutes).padStart(2, '0')}`;
  }

  function getLocalTimeZoneName() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || getGMTOffsetLabel();
  }

  function formatReadableDateTime(date) {
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();

    const month = date.toLocaleString(undefined, { month: 'short' });
    const day = date.getDate();

    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    if (sameYear) {
      return `${month} ${day}, ${hour}:${minute}`;
    }

    return `${month} ${day}, ${date.getFullYear()}, ${hour}:${minute}`;
  }

  function getKind(el) {
    if (el.classList.contains('submissionTimeChart--releaseDate')) {
      return 'Released';
    }

    if (el.classList.contains('submissionTimeChart--dueDate')) {
      return 'Due';
    }

    return 'Time';
  }

  function convertTimeElement(el) {
    const raw = el.getAttribute('datetime');
    if (!raw) return;

    const date = parseGradescopeDatetime(raw);
    if (!date) return;

    injectStyle();
    applyTimezoneVisibility();

    const mainText = formatReadableDateTime(date);
    const zoneText = getGMTOffsetLabel(date);
    const fullText = `${mainText} ${zoneText}`;

    el.classList.add('gs-local-time');

    if (!el.dataset.originalText) {
      el.dataset.originalText = el.textContent.trim();
      el.dataset.originalAriaLabel = el.getAttribute('aria-label') || '';
    }

    el.title = [
      `Local: ${fullText}`,
      `Original: ${el.dataset.originalText}`,
      `Original datetime: ${raw}`,
      '',
      'Click to show/hide timezone'
    ].join('\n');

    el.innerHTML = '';

    const main = document.createElement('span');
    main.className = 'gs-local-time-main';
    main.textContent = mainText;

    const dot = document.createElement('span');
    dot.className = 'gs-local-time-dot';
    dot.textContent = '·';

    const zone = document.createElement('span');
    zone.className = 'gs-local-time-zone';
    zone.textContent = zoneText;

    el.append(main, dot, zone);
    el.setAttribute('aria-label', `${getKind(el)} at ${fullText}`);
  }

  function convertHeaderAbbr(abbr) {
    const localOffset = getGMTOffsetLabel();
    const localZoneName = getLocalTimeZoneName();

    if (!abbr.dataset.originalText) {
      abbr.dataset.originalText = abbr.textContent.trim();
      abbr.dataset.originalTitle = abbr.getAttribute('title') || '';
    }

    abbr.textContent = localOffset;
    abbr.setAttribute('title', localZoneName);

    const th = abbr.closest('th');
    if (th) {
      if (!th.dataset.originalAriaLabel) {
        th.dataset.originalAriaLabel = th.getAttribute('aria-label') || '';
      }

      const originalAria = th.dataset.originalAriaLabel;
      const newAria = originalAria
        .replace(/Eastern Time \(US & Canada\)/g, `${localZoneName} (${localOffset})`)
        .replace(/Eastern Time \(US &amp; Canada\)/g, `${localZoneName} (${localOffset})`)
        .replace(/\bEDT\b|\bEST\b/g, localOffset);

      th.setAttribute('aria-label', newAria);
    }
  }

  function convertAll(root = document) {
    root.querySelectorAll?.(TIME_SELECTOR).forEach(convertTimeElement);

    if (root.matches?.(TIME_SELECTOR)) {
      convertTimeElement(root);
    }

    root.querySelectorAll?.(HEADER_ABBR_SELECTOR).forEach(convertHeaderAbbr);

    if (root.matches?.(HEADER_ABBR_SELECTOR)) {
      convertHeaderAbbr(root);
    }
  }

  document.addEventListener('click', event => {
    const timeEl = event.target.closest?.('time.gs-local-time');

    if (!timeEl) return;

    event.preventDefault();
    event.stopPropagation();

    toggleTimezoneVisibility();
  }, true);

  injectStyle();
  applyTimezoneVisibility();
  convertAll();

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          convertAll(node);
        }
      }

      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'datetime' &&
        mutation.target instanceof HTMLElement &&
        mutation.target.matches(TIME_SELECTOR)
      ) {
        convertTimeElement(mutation.target);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['datetime']
  });
})();
