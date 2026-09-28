// 首页：月历视图（整月 28~31 天），左右滑动或箭头切换月份 + 导入导出入口
import { initDB, getDiaryByDate } from "./db.js";
import { formatDate } from "./common.js";
import { exportBackup, importBackup } from "./backup.js";

let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0~11

function pad(n) {
  return String(n).padStart(2, "0");
}

async function renderMonth() {
  const first = new Date(viewYear, viewMonth, 1);
  const offset = (first.getDay() + 6) % 7; // 周一为每行第一天
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = formatDate(new Date());

  document.getElementById("monthTitle").textContent = `${viewYear}年${viewMonth + 1}月`;

  // 查询本月每天是否已有日记
  const hasDiary = {};
  for (let day = 1; day <= daysInMonth; day++) {
    const ds = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    const list = await getDiaryByDate(ds);
    hasDiary[ds] = list.length > 0;
  }

  const grid = document.getElementById("monthGrid");
  grid.innerHTML = "";

  // 月首前置空位（补足周一对齐）
  for (let i = 0; i < offset; i++) {
    const empty = document.createElement("div");
    empty.className = "day-cell empty";
    grid.appendChild(empty);
  }

  // 本月日期格子
  for (let day = 1; day <= daysInMonth; day++) {
    const ds = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    const isToday = ds === todayStr;
    const div = document.createElement("div");
    div.className = "day-cell" + (isToday ? " today" : "");
    div.innerHTML = `
      <span class="day-month">${pad(day)}</span>
      <span class="day-num">${day}</span>
      ${hasDiary[ds] ? '<span class="day-dot"></span>' : ""}
    `;
    div.onclick = () => {
      location.href = `./edit.html?date=${ds}`;
    };
    grid.appendChild(div);
  }
}

function prevMonth() {
  if (viewMonth === 0) { viewMonth = 11; viewYear--; } else { viewMonth--; }
  renderMonth();
}
function nextMonth() {
  if (viewMonth === 11) { viewMonth = 0; viewYear++; } else { viewMonth++; }
  renderMonth();
}

document.getElementById("prevMonth").onclick = prevMonth;
document.getElementById("nextMonth").onclick = nextMonth;

// 左右滑动切换月份（手指横滑超过 50px 且横向多于纵向才触发）
const calendar = document.getElementById("calendar");
let startX = null;
let startY = null;
calendar.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
}, { passive: true });
calendar.addEventListener("touchend", (e) => {
  if (startX == null) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) nextMonth(); else prevMonth();
  }
  startX = null;
  startY = null;
}, { passive: true });

// 导出备份
document.getElementById("exportBtn").onclick = async () => {
  try {
    await exportBackup();
  } catch (e) {
    alert("导出失败：" + e.message);
  }
};

// 导入备份
document.getElementById("importBtn").onclick = () => {
  document.getElementById("fileInput").click();
};
document.getElementById("fileInput").onchange = async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  if (!confirm("导入会将备份中的日记与标签合并进当前数据，继续吗？")) {
    ev.target.value = "";
    return;
  }
  try {
    const r = await importBackup(file);
    alert(`导入成功！新增/更新 ${r.diaryCount} 篇日记、${r.tagCount} 个标签。`);
    location.reload();
  } catch (err) {
    alert("导入失败：" + err.message);
  } finally {
    ev.target.value = "";
  }
};

await initDB();
renderMonth();
