function textOf(value) {
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(" ");
  if (value && typeof value === "object") return textOf(value.props?.children);
  return "";
}
function speechChunks(text, limit = 1200) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const chunks = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > limit && current) {
      chunks.push(current);
      current = "";
    }
    // Também limita palavras longas, como endereços e identificadores.
    let rest = word;
    while (rest.length > limit) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      chunks.push(rest.slice(0, limit));
      rest = rest.slice(limit);
    }
    current = [current, rest].filter(Boolean).join(" ");
  }
  if (current) chunks.push(current);
  return chunks;
}
module.exports = { textOf, speechChunks };
