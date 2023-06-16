// ==UserScript==
// @name        Copy URL as Markdown Link
// @name:zh-CN  复制Markdown链接
// @version     1.0.1
// @namespace   https://github.com/yxzlwz/browser_scripts
// @updateURL   https://raw.githubusercontent.com/Danny-Yxzl/browser_scripts/master/copy_url_as_markdown_link.js
// @author      异想之旅
// @match       *://*/*
// @grant       GM_registerMenuCommand
// ==/UserScript==

GM_registerMenuCommand("Generally", function () {
    copyMarkdownLink(false);
});

GM_registerMenuCommand("Without Query", function () {
    copyMarkdownLink(true);
});

GM_registerMenuCommand("Title Only", function () {
    navigator.clipboard.writeText(document.title);
});

function copyMarkdownLink(ignoreQuery) {
    let url = window.location.href;
    const title = document.title;

    if (ignoreQuery) {
        url = url.split("?")[0];
    }

    const markdownLink = `[${title}](${url})`;

    navigator.clipboard
        .writeText(markdownLink)
        .then(() => {
            console.log("URL copied as markdown link!");
        })
        .catch(error => {
            console.error("Error copying URL as markdown link:", error);
        });
}
