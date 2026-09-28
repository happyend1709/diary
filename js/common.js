// 公共工具函数

// 生成唯一 id
export function uuid() {
  return crypto.randomUUID();
}

// 把 Date 格式化为本地日期字符串 YYYY-MM-DD（避免 UTC 偏移导致日期错位）
export function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// HTML 转义，防止内容注入
export function escapeHtml(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}
