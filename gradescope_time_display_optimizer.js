// ==UserScript==
// @name         Gradescope Time Display Optimizer
// @version      1.2
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

    const STYLE_ID = 'gradescope-local-time-style';
    const STORAGE_KEY = 'gradescopeLocalTime.showTimezone';

    let scheduled = false;

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

      .gs-local-time-main,
      .gs-local-time-prefix {
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

      .progressBar--caption time.gs-local-time + time.gs-local-time {
        margin-left: 0.85em;
      }

      .progressBar--caption br + time.gs-local-time {
        margin-left: 0;
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

        if (minutes === 0) return `GMT${sign}${hours}`;
        return `GMT${sign}${hours}:${String(minutes).padStart(2, '0')}`;
    }

    function getLocalTimeZoneName() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || getGMTOffsetLabel();
    }

    function formatReadableDateTime(date) {
        const now = new Date();
        const sameYear = date.getFullYear() === now.getFullYear();

        const weekday = date.toLocaleString('en-US', { weekday: 'short' });
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');

        if (sameYear) return `${weekday}, ${month} ${day}, ${hour}:${minute}`;
        return `${weekday}, ${month} ${day}, ${date.getFullYear()}, ${hour}:${minute}`;
    }

    function getKind(el) {
        const originalText = el.dataset.originalText || el.textContent.trim();
        const originalAriaLabel =
            el.dataset.originalAriaLabel || el.getAttribute('aria-label') || '';

        if (
            /^Late Due Date\s*:/i.test(originalText) ||
            /^Late Due Date\s+at\b/i.test(originalAriaLabel)
        ) {
            return 'Late Due Date';
        }

        if (el.classList.contains('submissionTimeChart--releaseDate')) {
            return 'Released';
        }

        if (el.classList.contains('submissionTimeChart--dueDate')) {
            return 'Due';
        }

        return 'Time';
    }

    function getDisplayPrefix(el) {
        return getKind(el) === 'Late Due Date' ? 'Late Due Date: ' : '';
    }

    function convertTimeElement(el) {
        const raw = el.getAttribute('datetime');
        if (!raw) return;

        const date = parseGradescopeDatetime(raw);
        if (!date) return;

        if (!el.dataset.originalText) {
            el.dataset.originalText = el.textContent.trim();
            el.dataset.originalAriaLabel = el.getAttribute('aria-label') || '';
        }

        const kind = getKind(el);
        const prefixText = getDisplayPrefix(el);
        const mainText = formatReadableDateTime(date);
        const zoneText = getGMTOffsetLabel(date);
        const fullText = `${prefixText}${mainText} ${zoneText}`;

        el.classList.add('gs-local-time');

        const newTitle = [
            `Local: ${fullText}`,
            `Time zone: ${getLocalTimeZoneName()}`,
            `Original: ${el.dataset.originalText}`,
            `Original datetime: ${raw}`,
            '',
            'Click to show/hide timezone'
        ].join('\n');

        if (el.title !== newTitle) {
            el.title = newTitle;
        }

        el.innerHTML = '';

        if (prefixText) {
            const prefix = document.createElement('span');
            prefix.className = 'gs-local-time-prefix';
            prefix.textContent = prefixText;
            el.append(prefix);
        }

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

        const aria = `${kind} at ${mainText} ${zoneText}`;
        if (el.getAttribute('aria-label') !== aria) {
            el.setAttribute('aria-label', aria);
        }
    }

    function isDateHeader(th) {
        const text = th.textContent || '';
        const aria = th.getAttribute('aria-label') || '';

        return (
            /Due Date/i.test(aria) ||
            /Release and due date/i.test(aria) ||
            /Release and due date/i.test(text) ||
            /\bDue\b/i.test(text)
        );
    }

    function convertHeaderTimezone(root = document) {
        const localZoneName = getLocalTimeZoneName();

        const headers = new Set();

        root.querySelectorAll?.('th').forEach(th => {
            if (isDateHeader(th)) headers.add(th);
        });

        if (root.matches?.('th') && isDateHeader(root)) {
            headers.add(root);
        }

        for (const th of headers) {
            const abbrs = th.querySelectorAll('abbr');

            for (const abbr of abbrs) {
                if (!abbr.dataset.originalText) {
                    abbr.dataset.originalText = abbr.textContent.trim();
                    abbr.dataset.originalTitle = abbr.getAttribute('title') || '';
                }

                abbr.textContent = localZoneName;
                abbr.setAttribute('title', localZoneName);
                abbr.dataset.gsLocalTimeZoneAbbr = 'true';
            }

            if (!th.dataset.originalAriaLabel) {
                th.dataset.originalAriaLabel = th.getAttribute('aria-label') || '';
            }

            const originalAria = th.dataset.originalAriaLabel;

            let newAria = originalAria;

            // Example:
            // "Release and due date in Eastern Time (US & Canada): activate to sort column ascending"
            // -> "Release and due date in Asia/Shanghai: activate to sort column ascending"
            newAria = newAria.replace(
                /(Release and due date in )[^:]+(:.*)?$/i,
                (_, prefix, suffix = '') => `${prefix}${localZoneName}${suffix}`
            );

            // Fallback for other possible header labels.
            newAria = newAria.replace(
                /(Due date in )[^:]+(:.*)?$/i,
                (_, prefix, suffix = '') => `${prefix}${localZoneName}${suffix}`
            );

            newAria = newAria.replace(
                /(Release date in )[^:]+(:.*)?$/i,
                (_, prefix, suffix = '') => `${prefix}${localZoneName}${suffix}`
            );

            if (newAria && th.getAttribute('aria-label') !== newAria) {
                th.setAttribute('aria-label', newAria);
            }
        }
    }

    function convertAll(root = document) {
        injectStyle();
        applyTimezoneVisibility();

        root.querySelectorAll?.(TIME_SELECTOR).forEach(convertTimeElement);

        if (root.matches?.(TIME_SELECTOR)) {
            convertTimeElement(root);
        }

        convertHeaderTimezone(root);
    }

    function scheduleConvertAll(root = document) {
        if (scheduled) return;

        scheduled = true;

        requestAnimationFrame(() => {
            scheduled = false;
            convertAll(root);
        });
    }

    document.addEventListener(
        'click',
        event => {
            const timeEl = event.target.closest?.('time.gs-local-time');
            if (!timeEl) return;

            event.preventDefault();
            event.stopPropagation();

            toggleTimezoneVisibility();
        },
        true
    );

    convertAll();

    const observer = new MutationObserver(() => {
        scheduleConvertAll();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
            'datetime',
            'aria-label',
            'title',
            'class'
        ]
    });
})();