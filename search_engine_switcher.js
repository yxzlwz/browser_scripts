// ==UserScript==
// @name                Search Engine Switcher
// @name:zh-CN          搜索引擎切换
// @description         Switch search engines between Google, Baidu, and Bing.
// @description:zh-CN   切换搜索引擎为Google, Baidu, 和Bing.
// @namespace           https://github.com/Danny-Yxzl/browser_scripts
// @updateURL           https://ghproxy.com/https://raw.githubusercontent.com/Danny-Yxzl/browser_scripts/master/search_engine_switcher.js
// @author              异想之旅
// @match               *://*.bing.com/*
// @match               *://*.google.com/*
// @match               *://*.google.com.hk/*
// @match               *://*.baidu.com/*
// @run-at              document-end
// @version             1.0.0
// ==/UserScript==

(function () {
    const config = {
        google: {
            accept: ["bing", "baidu"],
            css: `
            .engine-icon {
                height: 1.8rem;
                margin-left: 0.8rem;
            }
            #engine-item {
                z-index: 9999;
            }
            `,
            // dom: "Q3DXx",
            dom: "tsf",
            input: "q",
            logo: "https://s1.imagehub.cc/images/2022/06/27/googleg_standard_color_128dp.png",
        },
        bing: {
            accept: ["google", "baidu"],
            css: `
            .engine-icon {
                height: 1.8rem;
                margin-left: 0.8rem;
            }
            `,
            // dom: "hasmic",
            dom: "b_searchboxForm",
            input: "q",
            logo: "https://s1.imagehub.cc/images/2022/06/27/bing.png",
        },
        baidu: {
            accept: ["google", "bing"],
            css: `
            .engine-icon {
                height: 30px;
                margin-left: 0.1rem;
            }
            #engine-item {
                margin-top: 20px;
            }
            `,
            // dom: "s_form_wrapper",
            dom: "fm",
            input: "wd",
            logo: "https://s1.imagehub.cc/images/2022/06/27/favicon.png",
        },
    };

    // 判断搜索引擎
    let engine = "";
    const domain = window.location.hostname;
    if (domain.includes(".bing.com")) engine = "bing";
    else if (domain.includes(".google.com")) engine = "google";
    else if (domain.includes(".baidu.com")) engine = "baidu";
    console.log(engine);
    const q = document.getElementsByName(config[engine].input)[0].value;
    if (q === "") return;

    const do_search = target => {
        let url = "";
        switch (target) {
            case "bing":
                url = `https://www.bing.com/search?q=${q}`;
                break;
            case "google":
                url = `https://www.google.com/search?q=${q}`;
                break;
            case "baidu":
                url = `https://www.baidu.com/s?wd=${q}`;
                break;
            default:
                url = `https://www.bing.com/search?q=${q}`;
                break;
        }
        window.location.href = url;
    };

    const search_dom = document.getElementsByClassName(config[engine].dom)[0];
    const div = document.createElement("div");
    div.id = "engine-group";
    div.style.zIndex = "9999";
    div.style.display = "inline-block";
    for (let i = 0; i < config[engine].accept.length; i++) {
        const target = config[engine].accept[i];
        const logo = document.createElement("div");
        logo.id = "engine-item";
        logo.style.display = "inline-block";
        logo.style["vertical-align"] = "middle";
        logo.innerHTML = `
        <img src="${config[target].logo}" class="engine-icon" style="cursor: pointer" />
    `;
        logo.onclick = do_search.bind(null, target);
        div.appendChild(logo);
    }
    // search_dom.appendChild(div);
    search_dom.after(div);
    // 追加样式
    const st = document.createElement("style");
    st.innerHTML = config[engine].css;
    document.head.appendChild(st);
})();
