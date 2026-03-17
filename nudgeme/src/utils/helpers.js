export const wordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const topicKey = (t) => `${t.coacheeName}::${t.topic}`;

export const generateSentKey = (key) => `${key}::sent`;

