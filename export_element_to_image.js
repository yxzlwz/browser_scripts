// ==UserScript==
// @name        Export Element to Image
// @name:zh-CN  元素导出为图片
// @namespace   https://github.com/yxzlwz/browser_scripts
// @updateURL   https://raw.githubusercontent.com/yxzlwz/browser_scripts/master/export_element_to_image.js
// @author      异想之旅
// @match       *://*.zhihu.com/question/*/answer/*
// @version     1.0.0
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_addScript
// ==/UserScript==

GM_xmlhttpRequest({
    method: "GET",
    url: "https://html2canvas.hertzen.com/dist/html2canvas.min.js",
    onload(res) {
        let script = document.createElement("script");
        script.textContent = res.responseText;
        document.body.appendChild(script);
    },
});

function exportElementAsImage(element_selector, filename = "image.png") {
    const element = document.querySelector(element_selector);
    let canvas;
    html2canvas(element).then(_canvas => {
        canvas = _canvas;
        document.body.appendChild(canvas);
        const image = new Image();
        image.src = canvas.toDataURL();
        const link = document.createElement("a");
        link.href = image.src;
        link.download = filename;
        link.click();
    });
}

if (location.host === "www.zhihu.com") {
    GM_registerMenuCommand("Zhihu - Answer", function () {
        let title = document.title;
        title = title
            .replace(/ - 知乎$/, "")
            .replace(/\(.*\)/, "")
            .replace(/\s/g, "")
            .replace(/:/g, "：")
            .replace(/\?/g, "？")
            .replace(/!/g, "！");
        exportElementAsImage(
            "#root > div > main > div > div > div.Question-main > div.ListShortcut > div > div.Card.AnswerCard.css-0",
            title + ".png"
        );
    });
}
