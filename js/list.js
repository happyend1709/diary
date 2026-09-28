// 日记列表页：按 年 → 月 → 标签 筛选，默认最新日期所在年月，点击进入编辑
import { initDB, getAllDiaries, getAllTags } from "./db.js";
import { escapeHtml } from "./common.js";

let allDiaries = [];
let allTags = [];
let filterTagId = null;
let selectedYear;
let selectedMonth;

await initDB();
allDiaries = await getAllDiaries();
allTags = await getAllTags();

// 默认定位到最新一条日记所在的年月
const latest = allDiaries.length
  ? allDiaries.reduce((a, b) => (b.date > a.date ? b : a))
  : null;
const now = new Date();
const years = [...new Set(allDiaries.map((d) => d.date.slice(0, 4)))].sort();
if (years.length === 0) years.push(String(now.getFullYear()));
selectedYear = latest ? latest.date.slice(0, 4) : String(now.getFullYear());
selectedMonth = latest ? +latest.date.slice(5, 7) : now.getMonth() + 1;

renderYearRow();
renderMonthRow();
renderFilterTags();
renderDiaryList();

// 年份选择行
function renderYearRow() {
  const sel = document.getElementById("yearSelect");
  sel.innerHTML = "";
  years.forEach((y) => {
    const o = document.createElement("option");
    o.value = y;
    o.textContent = `${y}年`;
    if (y === selectedYear) o.selected = true;
    sel.appendChild(o);
  });
  sel.onchange = () => {
    selectedYear = sel.value;
    renderMonthRow();
    renderDiaryList();
  };
}

// 月份选择行：列出该年有日记的月份；无数据时列出 1~12 月
function renderMonthRow() {
  const sel = document.getElementById("monthSelect");
  sel.innerHTML = "";
  const monthsInYear = [
    ...new Set(
      allDiaries
        .filter((d) => d.date.startsWith(selectedYear))
        .map((d) => +d.date.slice(5, 7))
    )
  ].sort();
  const options = monthsInYear.length
    ? monthsInYear
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // 若当前选中月份在该年无日记，自动落到该年最近有日记的月份
  if (monthsInYear.length && !monthsInYear.includes(selectedMonth)) {
    selectedMonth = monthsInYear[monthsInYear.length - 1];
  }
  options.forEach((m) => {
    const o = document.createElement("option");
    o.value = m;
    o.textContent = `${m}月`;
    if (m === selectedMonth) o.selected = true;
    sel.appendChild(o);
  });
  sel.onchange = () => {
    selectedMonth = +sel.value;
    renderDiaryList();
  };
}

// 标签筛选行
function renderFilterTags() {
  const box = document.getElementById("tagFilterBox");
  box.innerHTML = "";
  const mk = (label, id) => {
    const span = document.createElement("span");
    span.className = "tag-chip" + (filterTagId === id ? " active" : "");
    span.textContent = label;
    span.onclick = () => {
      filterTagId = id;
      renderFilterTags();
      renderDiaryList();
    };
    return span;
  };
  box.appendChild(mk("全部", null));
  allTags.forEach((t) => box.appendChild(mk(t.name, t.id)));
}

// 同时按 年月 + 标签 过滤
function filteredList() {
  const ym = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
  let list = allDiaries.filter((d) => d.date.startsWith(ym));
  if (filterTagId) list = list.filter((d) => (d.tagIds || []).includes(filterTagId));
  list.sort((a, b) => b.date.localeCompare(a.date));
  return list;
}

function renderDiaryList() {
  const box = document.getElementById("diaryList");
  const list = filteredList();
  box.innerHTML = "";
  if (list.length === 0) {
    box.innerHTML = '<p class="hint">该月暂无日记。</p>';
    return;
  }
  list.forEach((diary) => {
    const tagNames = allTags
      .filter((t) => (diary.tagIds || []).includes(t.id))
      .map((t) => t.name)
      .join(" / ");
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <div class="list-date">${escapeHtml(diary.date)}</div>
      ${tagNames ? `<div class="list-tags">${escapeHtml(tagNames)}</div>` : ""}
      <div class="list-content">${escapeHtml(diary.content)}</div>
    `;
    div.onclick = () => {
      location.href = `./edit.html?id=${diary.id}&date=${diary.date}`;
    };
    box.appendChild(div);
  });
}
