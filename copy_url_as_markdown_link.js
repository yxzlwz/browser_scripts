// ==UserScript==
// @name        Copy URL as Markdown Link
// @name:zh-CN  复制Markdown链接
// @namespace   https://github.com/yxzlwz/browser_scripts
// @author      异想之旅
// @match       *://*/*
// @grant       GM_registerMenuCommand
// ==/UserScript==

// Register the menu commands for the script
GM_registerMenuCommand("Generally", function () {
    copyMarkdownLink(false);
});

GM_registerMenuCommand("Without Query", function () {
    copyMarkdownLink(true);
});

// Function to copy the current page's URL and title as a markdown link
function copyMarkdownLink(ignoreQuery) {
    // Get the current page's URL and title
    var url = window.location.href;
    var title = document.title;

    // Remove the query string if ignoreQuery is true
    if (ignoreQuery) {
        url = url.split("?")[0];
    }

    // Create the markdown link format
    var markdownLink = "[" + title + "](" + url + ")";

    // Copy the markdown link to the clipboard
    navigator.clipboard
        .writeText(markdownLink)
        .then(function () {
            // Show a success message
            console.log("URL copied as markdown link!");
        })
        .catch(function (error) {
            // Show an error message
            console.error("Error copying URL as markdown link:", error);
        });
}
