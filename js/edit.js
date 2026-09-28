// 编辑页：新建 / 修改日记、日期修改、多标签绑定、保存与删除
import { initDB, getDiary, getDiaryByDate, putDiary, deleteDiary, getAllTags, addTag } from "./db.js";
import { uuid, formatDate } from "./common.js";

const params = new URLSearchParams(location.search);
let editingId = params.get("id"); // null 表示新建
let date = params.get("date");
let allTags = [];
let selectedTagIds = [];

await initDB();
allTags = await getAllTags();

// 若新建但该日期已存在日记，则直接打开已有日记（避免重复创建）
if (!editingId && date) {
  const existing = await getDiaryByDate(date);
  if (existing.length > 0) editingId = existing[0].id;
}

if (!date) date = formatDate(new Date());

// 编辑模式：载入已有内容
if (editingId) {
  const diary = await getDiary(editingId);
  if (diary) {
    document.getElementById("diaryContent").value = diary.content;
    selectedTagIds = diary.tagIds || [];
    date = diary.date;
  }
}

document.getElementById("diaryDate").value = date;
document.getElementById("pageTitle").textContent = editingId ? "编辑日记" : "新建日记";
renderTags();

function renderTags() {
  const box = document.getElementById("tagListBox");
  box.innerHTML = "";
  if (allTags.length === 0) {
    box.innerHTML = '<span class="hint">还没有标签，可在下方输入新建</span>';
  }
  allTags.forEach((tag) => {
    const active = selectedTagIds.includes(tag.id);
    const chip = document.createElement("span");
    chip.className = "tag-chip" + (active ? " active" : "");
    chip.textContent = tag.name;
    chip.onclick = () => {
      selectedTagIds = active
        ? selectedTagIds.filter((i) => i !== tag.id)
        : [...selectedTagIds, tag.id];
      renderTags();
    };
    box.appendChild(chip);
  });
}

// 新建标签并自动选中
document.getElementById("addTempTagBtn").onclick = async () => {
  const input = document.getElementById("newTagInput");
  const name = input.value.trim();
  if (!name) return;
  if (allTags.some((t) => t.name === name)) {
    alert("该标签已存在");
    return;
  }
  const newTag = { id: uuid(), name };
  await addTag(newTag);
  allTags = await getAllTags();
  selectedTagIds.push(newTag.id);
  input.value = "";
  renderTags();
};

// 保存
document.getElementById("saveBtn").onclick = async () => {
  const content = document.getElementById("diaryContent").value.trim();
  const d = document.getElementById("diaryDate").value;
  if (!d) {
    alert("请选择日期");
    return;
  }
  if (!content) {
    alert("请填写日记内容");
    return;
  }
  const now = new Date().toISOString();
  const diary = {
    id: editingId || uuid(),
    date: d,
    content,
    tagIds: selectedTagIds,
    updatedAt: now
  };
  if (!editingId) diary.createdAt = now;
  await putDiary(diary);
  // 保存后不弹窗，直接返回首页
  location.href = "./index.html";
};

// 删除
document.getElementById("delBtn").onclick = async () => {
  if (!editingId) {
    alert("这篇日记还没保存过，无需删除");
    return;
  }
  if (confirm("确定删除这篇日记？")) {
    await deleteDiary(editingId);
    location.href = "./index.html";
  }
};
