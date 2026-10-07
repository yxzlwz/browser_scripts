// ==UserScript==
// @name        Copy URL as Markdown Link
// @name:zh-CN  复制 Markdown 链接
// @description Copy URL as Markdown Link
// @version     1.0.2
// @namespace   https://github.com/yxzlwz/browser_scripts
// @downloadURL https://raw.githubusercontent.com/Danny-Yxzl/browser_scripts/master/copy_url_as_markdown_link.js
// @updateURL   https://raw.githubusercontent.com/Danny-Yxzl/browser_scripts/master/copy_url_as_markdown_link.js
// @author      yxzlwz
// @match       *://*/*
// @grant       GM_registerMenuCommand
// @grant       GM_setClipboard
// ==/UserScript==

GM_registerMenuCommand("Generally", function () {
    copyMarkdownLink(false);
});

GM_registerMenuCommand("Without Query", function () {
    copyMarkdownLink(true);
});

GM_registerMenuCommand("Title Only", function () {
    GM_setClipboard(document.title);
});

function copyMarkdownLink(ignoreQuery) {
    const url = new URL(window.location.href);
    const title = document.title;

    if (ignoreQuery) {
        url.search = "";
    }

    const markdownLink = `[${title}](${url.href})`;

    GM_setClipboard(markdownLink);
}
