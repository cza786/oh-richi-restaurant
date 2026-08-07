const sharp = require('../../node_modules/sharp');

const jobs = [
  ['public/3d_bun_top_v2.png', 'public/burger/bun-top.webp', [0, 1, 0]],
  ['public/3d_lettuce.png', 'public/burger/lettuce-top.webp', [0, 0, 0]],
  ['public/3d_tomato.png', 'public/burger/tomato.webp', [1, 3, 2]],
  ['tmp/imagegen/onion-source.png', 'public/burger/onion.webp', [0, 255, 0]],
  ['public/3d_cheese.png', 'public/burger/cheese.webp', [1, 1, 1]],
  ['public/3d_patty_v2.png', 'public/burger/patty.webp', [1, 1, 1]],
  ['public/3d_lettuce.png', 'public/burger/lettuce-bottom.webp', [0, 0, 0]],
  ['public/3d_bun_bottom_v2.png', 'public/burger/bun-bottom.webp', [0, 2, 1]],
];

async function removeKey(input, output, key) {
  const isGreen = key[1] > 200;
  const image = sharp(input).resize(1024, 1024, { fit: 'fill' }).removeAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);

  for (let src = 0, dst = 0; src < data.length; src += 3, dst += 4) {
    const r = data[src];
    const g = data[src + 1];
    const b = data[src + 2];
    const distance = Math.hypot(r - key[0], g - key[1], b - key[2]);
    const low = isGreen ? 18 : 10;
    const high = isGreen ? 145 : 105;
    let alpha = Math.max(0, Math.min(255, ((distance - low) / (high - low)) * 255));

    // Despill chroma green on partially transparent edge pixels.
    const edge = alpha / 255;
    const cleanG = isGreen ? Math.min(g, Math.max(r, b) + 12) : g;
    rgba[dst] = r;
    rgba[dst + 1] = Math.round(cleanG * edge);
    rgba[dst + 2] = b;
    rgba[dst + 3] = Math.round(alpha);
  }

  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(output);
}

(async () => {
  for (const job of jobs) await removeKey(...job);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
