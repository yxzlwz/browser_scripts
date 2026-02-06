// ==UserScript==
// @name                Remove CSDN
// @name:zh-CN          移除CSDN
// @description         Remove CSDN from Google Search.
// @description:zh-CN   移除谷歌搜索中的CSDN。
// @namespace           https://github.com/yxzlwz/browser_scripts
// @updateURL           https://raw.githubusercontent.com/yxzlwz/browser_scripts/master/remove_csdn.js
// @downloadURL         https://raw.githubusercontent.com/yxzlwz/browser_scripts/master/remove_csdn.js
// @author              yxzlwz
// @match               *://*.google.com/*
// @match               *://*.google.com.hk/*
// @run-at              document-end
// @version             1.1.0
// ==/UserScript==

(function () {
    function main(node) {
        const list = node.getElementsByTagName("a");
        for (let i = 0; i < list.length; i++) {
            const a = list[i];
            if (a.href.startsWith("https://blog.csdn.net/")) {
                let parent = a;
                for (let j = 0; j < 5; j++) {
                    parent = parent.parentElement;
                }
                if (parent) {
                    parent.style.display = "none";
                }
            }
        }
    }
    main(window.document);

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    main(node);
                }
            });
        }
    });

    observer.observe(window.document.body, {
        childList: true,
        subtree: true,
    });
})();
