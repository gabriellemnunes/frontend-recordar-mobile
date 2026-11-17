const fs = require("node:fs/promises");
const { Resvg } = require("@resvg/resvg-js");
async function main() {
  const source = await fs.readFile("assets/recordar-logo.svg", "utf8");
  // Mede os pixels roxos do símbolo, sem considerar o quadrado claro de fundo.
  const original = new Resvg(source, {
    fitTo: { mode: "width", value: 1024 },
  }).render();
  const pixels = original.pixels;
  let minX = 1024,
    minY = 1024,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < original.height; y++)
    for (let x = 0; x < original.width; x++) {
      const i = (y * original.width + x) * 4;
      if (
        pixels[i] < 180 &&
        pixels[i + 1] < 100 &&
        pixels[i + 2] > 70 &&
        pixels[i + 3] > 200
      ) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  const dx = 512 - (minX + maxX) / 2,
    dy = 512 - (minY + maxY) / 2;
  const centered = source
    .replace("<path ", `<g transform="translate(${dx} ${dy})"><path `)
    .replace("</svg>", "</g></svg>");
  await fs.writeFile("assets/recordar-logo-centered.svg", centered);
  await fs.writeFile(
    "assets/recordar-logo-source.js",
    "// Gerado de recordar-logo.svg por scripts/build-brand-icon.cjs.\nmodule.exports = " +
      JSON.stringify(centered) +
      ";\n",
  );
  const image = new Resvg(centered, {
    background: "#F8F5FF",
    fitTo: { mode: "width", value: 1024 },
  }).render();
  await fs.writeFile("assets/recordar-icon.png", image.asPng());
  console.log(
    `Logo centralizada pelo símbolo: deslocamento ${dx}, ${dy}. Ícone atualizado.`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
