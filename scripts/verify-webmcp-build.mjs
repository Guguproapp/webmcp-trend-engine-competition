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

for (const name of ['search_radar_trends', 'get_radar_trend', 'search_radar_videos', 'list_radar_sources', 'list_radar_markets', 'list_radar_categories']) {
  if (!builtAssets.includes(name)) throw new Error(`WebMCP正式Build缺少工具：${name}`);
}
for (const marker of ['registerTool', 'readOnlyHint', 'untrustedContentHint', 'READ-ONLY WEBMCP']) {
  if (!builtAssets.includes(marker)) throw new Error(`WebMCP正式Build缺少必要標記：${marker}`);
}
for (const forbidden of ['YOUTUBE_API_KEY', 'REFRESH_ADMIN_TOKEN', 'RADAR_PROGRAM_API_TOKEN', 'BEGIN PRIVATE KEY', 'PRIVATE KEY', 'Bearer ey', 'localStorage.clear()', '正式B版D1', '/api/v1/admin/settings']) {
  if (builtAssets.includes(forbidden)) throw new Error(`WebMCP正式Build包含禁止內容：${forbidden}`);
}
for (const legacyWriteTool of ['add_trend_to_watchlist', 'exclude_trend']) {
  if (builtAssets.includes(legacyWriteTool)) throw new Error(`本輪正式Build不得註冊舊寫入工具：${legacyWriteTool}`);
}
if (/AIza[0-9A-Za-z_-]{30,}/u.test(builtAssets)) throw new Error('WebMCP正式Build疑似包含Google API金鑰。');
for (const pattern of [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
  /\bgh[opusr]_[0-9A-Za-z]{30,}\b/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/u,
  /https:\/\/[^\s"'<>]+[?&](?:token|access_token|refresh_token|api_key|apikey|secret|password|authorization|cookie|session_id|signature|sig|x-amz-[^=]*)=[^\s&"'<>]+/iu,
]) if (pattern.test(builtAssets)) throw new Error(`WebMCP正式Build疑似包含密密值或私人簽名網址：${pattern.source}`);
if (/document\s*\.\s*modelContext\s*=/u.test(source)) throw new Error('不得以自建屬性假冒原生WebMCP。');
if (!source.includes("additionalProperties: false")) throw new Error('WebMCP工具輸入必須拒絕未定義欄位。');

console.log(`WebMCP Build檢查通過：六個唯讀雷達工具、原生註冊、信任標註與秘密掃描均符合比賽版邊界（${distFiles.length}個產物檔案）。`);
