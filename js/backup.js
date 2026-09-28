// 备份：导出 JSON 到手机 / 导入本地 JSON 文件（完全离线）
import { exportAllData, importAllData } from "./db.js";

// 导出：把所有日记 + 标签打包成 JSON 并下载
export async function exportBackup() {
  const data = await exportAllData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `周日记备份_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert(`已导出 ${data.diaries.length} 篇日记、${data.tags.length} 个标签。\n请到手机"下载/文件"目录查看备份文件。`);
  return data;
}

// 导入：读取本地 JSON 备份并合并进本地数据库
export async function importBackup(file) {
  const text = await file.text();
  const json = JSON.parse(text);
  if (!json || !Array.isArray(json.diaries) || !Array.isArray(json.tags)) {
    throw new Error("备份文件格式错误");
  }
  const result = await importAllData(json);
  return result;
}
