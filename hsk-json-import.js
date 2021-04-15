// ==UserScript==
// @name         harmlesskey json import button
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  This script adds an import button for 5e.tools monster JSONs.
// @author       Chesta
// @match        https://harmlesskey.com/*
// @icon         https://www.google.com/s2/favicons?domain=harmlesskey.com
// @grant        none
// @run-at       document-idle
// @require     https://5e.tools/js/shared.js
// ==/UserScript==

// ignore the jquery errors please, I don't wanna include it too

const safeJoin = (arr) => {
    if (arr && arr.length) return arr.join(', ');
    return '';
}

const monTypeToSplitType = function (type) {
    let asText = "";
    let subTypeText = "";

    if (typeof type === "string") {
        // handles e.g. "fey"
        asText = type;
        return [asText, subTypeText];
    }

    const tempTags = [];
    if (type.tags) {
        for (const tag of type.tags) {
            if (typeof tag === "string") {
                // handles e.g. "fiend (devil)"
                tempTags.push(tag);
            } else {
                // handles e.g. "humanoid (Chondathan human)"
                tempTags.push(`${tag.prefix} ${tag.tag}`);
            }
        }
    }
    if (type.swarmSize) {
        asText = `swarm of ${Parser.sizeAbvToFull(type.swarmSize).toLowerCase()} ${Parser.monTypeToPlural(type.type)}`;
    } else {
        asText = `${type.type}`;
    }
    if (tempTags.length > 1) subTypeText = ` (${tempTags.join(", ")})`;
    else if (tempTags.length) subTypeText = tempTags[0];
    return [asText, subTypeText];
};

const getTokenUrl = (mon) => {
    return mon.tokenUrl || encodeURI(UrlUtil.link(`https://5e.tools/img/${Parser.sourceJsonToAbv(mon.source)}/${Parser.nameToTokenName(mon.name)}.png`));
};

const getACValue = (mon) => {
    if (typeof mon.ac[0] === 'number') return mon.ac[0];
    else return mon.ac[0].ac;
};

const getSensesString = (mon) => {
    return `${mon.senses ? `${mon.senses.join(', ')}, ` : ""}passive Perception ${mon.passive || "—"}`
};

const setInputValue = (e, text) => {
    const c = e.getElementsByTagName('input')[0];
    c.value = text;
    // e.__vue__.value = text;
    c.dispatchEvent(new Event('input'));
};

const setSelectValue = (e, val) => {
    const s = e.firstChild.firstChild;
    s.focus();
    s.click();
    setTimeout(() => {
        const menuItems = document.getElementsByClassName('q-menu')[0].children[1].firstChild.children;
        for (let mi of menuItems) {
            if (mi.innerText === val) {
                mi.focus();
                mi.click();
                break;
            }
        }
    }, 100);
};

const fillBasicInfo = (card, mon) => {
    const is = card.getElementsByClassName('q-input');
    setInputValue(is[0], mon.name);
    setInputValue(is[1], Parser.sizeAbvToFull(mon.size));
    // get type and subtype(s)
    let fullType = monTypeToSplitType(mon.type);
    setInputValue(is[2], fullType[0]);
    setInputValue(is[3], fullType[1]);
    setInputValue(is[4], Parser.alignmentListToFull(mon.alignment));
    setInputValue(is[5], Parser.getSpeedString(mon));
    setInputValue(is[6], getSensesString(mon));
    setInputValue(is[7], safeJoin(mon.languages));
    setInputValue(is[8], getTokenUrl(mon))
    setSelectValue(card.getElementsByClassName('q-select')[0], mon.cr);
};

const fillHealthAC = (card, mon) => {
    const is = card.getElementsByClassName('q-input');
    setInputValue(is[0], getACValue(mon));
    setInputValue(is[1], mon.hp.average);
    setInputValue(is[2], mon.hp.formula.split(' ')[0]);
};

const fillAbilityScores = (card, mon) => {
    const is = card.getElementsByClassName('q-input');
    setInputValue(is[0], mon.str);
    setInputValue(is[1], mon.dex);
    setInputValue(is[2], mon.con);
    setInputValue(is[3], mon.int);
    setInputValue(is[4], mon.wis);
    setInputValue(is[5], mon.cha);
};

const fillSavingThrows = (card, mon) => {
    if (!mon.save) return;

    const is = card.getElementsByClassName('q-input');
    const abilities = Parser.ABIL_ABVS;
    for (let i = 0; i < abilities.length; i++) {
        if (mon.save.hasOwnProperty(abilities[i])) {
            setInputValue(is[i], parseInt(mon.save[abilities[i]]));
        }
    }
};

const fillSkills = (card, mon) => {
    if (!mon.skill) return;

    const is = card.getElementsByClassName('q-input');
    const skills = Object.keys(Parser.SKILL_TO_SHORT).sort();
    for (let i = 0; i < skills.length; i++) {
        if (mon.skill.hasOwnProperty(skills[i])) {
            setInputValue(is[i], parseInt(mon.skill[skills[i]]));
        }
    }
};

const fillImmunities = (card, mon) => {
    const is = card.getElementsByClassName('q-input');

    if (mon.vulnerable) {
        setInputValue(is[0], Parser.getFullImmRes(mon.vulnerable));
    }
    if (mon.resist) {
        setInputValue(is[1], Parser.getFullImmRes(mon.resist));
    }
    if (mon.immune) {
        setInputValue(is[2], Parser.getFullImmRes(mon.immune));
    }
    setInputValue(is[3], safeJoin(mon.conditionImmune));
};

const importJSON = (text) => {
    const mon = JSON.parse(text);
    const bodies = document.getElementsByClassName('card-body');
    const s = document.getElementsByClassName('q-select')[0]
    fillBasicInfo(bodies[1], mon);
    fillHealthAC(bodies[2], mon);
    fillAbilityScores(bodies[3], mon);
    fillSavingThrows(bodies[4], mon);
    fillSkills(bodies[5], mon);
    fillImmunities(bodies[6], mon);
};

const appendContainer = (container) => {
    const anchors = document.getElementsByClassName('entities');
    if (anchors.length) {
        anchors[0].parentElement.appendChild(container);
        return true;
    }
    else return false;
}

const addButtonWhenReady = () => {
    const container = document.createElement('div');
    const btn = document.createElement('button');
    const icon = document.createElement('i');
    container.className = "save";
    btn.className = "btn";
    icon.className = "fas fa-brackets-curly";
    container.style = 'display: flex; justify-content: flex-end; padding: 10px 0';
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(" Import JSON from Clipboard"));
    btn.onclick = async () => (importJSON(await navigator.clipboard.readText()));
    container.appendChild(btn);

    const int = setInterval(() => {
        if (appendContainer(container)) {
            clearInterval(int);
        }
    }, 500);
};

(() => {
    'use strict';
    let inNPC = false;
    setInterval(() => {
        if (/\/npcs\/.+/ig.test(window.location.pathname)) {
            if (!inNPC) {
                addButtonWhenReady();
                inNPC = true;
            }
        }
        else if (inNPC) {
            inNPC = false;
        }
    }, 1000);
})();
