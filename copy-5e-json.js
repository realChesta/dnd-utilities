// ==UserScript==
// @name         5e.tools json button
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  This script adds a "copy JSON" button in the 5e.tools bestiary.
// @author       Chesta
// @match        https://5e.tools/bestiary.html
// @icon         https://www.google.com/s2/favicons?domain=5e.tools
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';
    window.addEventListener('toolsLoaded', () => {
        const el = document.getElementById('tabs-right');
        const btn = document.createElement("button");
        btn.appendChild(document.createTextNode("{ }"));
        btn.style = "font-weight: 800; padding-top: 0";
        btn.title = "Copy JSON";
        btn.className = "ui-tab__btn-tab-head btn btn-default";
        btn.onclick = async () => {
            await navigator.clipboard.write([new ClipboardItem({
                "text/plain": new Blob([JSON.stringify(lastRendered.mon)],
                    { type: "text/plain" })
            })]);
        };
        el.insertBefore(btn, el.firstChild);
    });
})();
