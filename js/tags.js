// 标签管理页：新增 / 重命名 / 删除标签
import { initDB, getAllTags, putTag, deleteTag } from "./db.js";
import { uuid } from "./common.js";

await initDB();
renderList();

async function renderList() {
  const tags = await getAllTags();
  const box = document.getElementById("tagList");
  box.innerHTML = "";
  if (tags.length === 0) {
    box.innerHTML = '<p class="hint">还没有标签，请在下方新增。</p>';
    return;
  }
  tags.forEach((tag) => {
    const row = document.createElement("div");
    row.className = "tag-row";

    const input = document.createElement("input");
    input.value = tag.name;
    input.className = "input flex-1";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "保存";
    saveBtn.className = "btn btn-green";
    saveBtn.onclick = async () => {
      const name = input.value.trim();
      if (!name) return;
      await putTag({ ...tag, name });
      renderList();
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "删除";
    delBtn.className = "btn btn-danger";
    delBtn.onclick = async () => {
      if (confirm(`删除标签"${tag.name}"？日记内容不会受影响。`)) {
        await deleteTag(tag.id);
        renderList();
      }
    };

    row.append(input, saveBtn, delBtn);
    box.appendChild(row);
  });
}

document.getElementById("addTagBtn").onclick = async () => {
  const input = document.getElementById("tagNameInput");
  const name = input.value.trim();
  if (!name) return;
  const tags = await getAllTags();
  if (tags.some((t) => t.name === name)) {
    alert("标签已存在");
    return;
  }
  await putTag({ id: uuid(), name });
  input.value = "";
  renderList();
};
