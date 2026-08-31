import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? filesUnder(join(directory, entry.name)) : [join(directory, entry.name)]))).flat();
}

const root = fileURLToPath(new URL('..', import.meta.url));
const distFiles = await filesUnder(join(root, 'dist'));
const builtAssets = (await Promise.all(distFiles.filter((file) => /\.(?:html|js|css)$/u.test(file)).map((file) => readFile(file, 'utf8')))).join('\n');
const sourceFiles = await filesUnder(join(root, 'src/modules/webmcp'));
const source = (await Promise.all(sourceFiles.filter((file) => /\.(?:ts|tsx)$/u.test(file) && !file.includes('/tests/')).map((file) => readFile(file, 'utf8')))).join('\n');

for (const name of ['search_trends', 'get_trend_evidence', 'get_source_status', 'add_trend_to_watchlist', 'exclude_trend']) {
  if (!builtAssets.includes(name)) throw new Error(`WebMCP正式Build缺少工具：${name}`);
}
for (const marker of ['registerTool', 'readOnlyHint', 'untrustedContentHint', 'Human-in-the-loop WebMCP']) {
  if (!builtAssets.includes(marker)) throw new Error(`WebMCP正式Build缺少必要標記：${marker}`);
}
for (const forbidden of ['YOUTUBE_API_KEY', 'REFRESH_ADMIN_TOKEN', 'BEGIN PRIVATE KEY', 'PRIVATE KEY', 'Bearer ey', 'localStorage.clear()', '正式B版D1']) {
  if (builtAssets.includes(forbidden) || source.includes(forbidden)) throw new Error(`WebMCP正式Build或來源包含禁止內容：${forbidden}`);
}
if (/AIza[0-9A-Za-z_-]{30,}/u.test(builtAssets)) throw new Error('WebMCP正式Build疑似包含Google API金鑰。');
if (/document\s*\.\s*modelContext\s*=/u.test(source)) throw new Error('不得以自建屬性假冒原生WebMCP。');
if (!source.includes("additionalProperties: false")) throw new Error('WebMCP工具輸入必須拒絕未定義欄位。');

console.log(`WebMCP Build檢查通過：五工具、原生註冊、信任標註與秘密掃描均符合比賽版邊界（${distFiles.length}個產物檔案）。`);
