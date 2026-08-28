import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const forbidden = [
  '帳號開通管家',
  'Mock OAuth',
  '平台連接',
  'AI影音發布助手',
  'AI 影音發布助手',
  '/onboarding',
  '/oauth/mock',
  '/settings/connections',
  'account-onboarding',
  'platform-connections',
  'brand-profile',
  'MockPlatformAuthorizationProvider',
  'oauth-page',
  'platform-card',
  'choice-card',
  'profile-header',
  'dashboard-hero',
  'account-preview',
];

const engineeringTerms = [
  'MockTrendSourceProvider',
  'TrendScoreCalculator',
  'Repository',
  '工作包 002',
  '工作包002',
  'infrastructure',
  'application',
  'domain',
];

const untranslatedPublicTerms = [
  'Mock',
  'SaaS',
  'TREND DISCOVERY',
  'RC2',
  'MVP',
  'trend-score',
  'google_trends',
  'news_rss',
  'competitor_tracking',
];

const requiredLocalizedCopy = [
  '熱門引擎｜爆紅流量情報服務',
  '熱門引擎｜初步產品審核',
  '第二次測試候選版',
  '展示審核資料｜非即時熱門情報',
  'Threads社群討論',
  'YouTube影音平台',
  'Google熱門搜尋趨勢',
  '新聞訂閱來源',
  '熱點評分版本1.0.0',
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

const files = await filesUnder(fileURLToPath(new URL('../dist', import.meta.url)));
const distDirectory = fileURLToPath(new URL('../dist', import.meta.url));
const requiredStaticFiles = ['_redirects', '_headers', 'robots.txt'];

const publicUiSourceDirectories = [
  fileURLToPath(new URL('../src/shared/presentation', import.meta.url)),
  fileURLToPath(new URL('../src/modules/trend-discovery/presentation', import.meta.url)),
];
const publicUiSourceFiles = [
  ...(await Promise.all(publicUiSourceDirectories.map(filesUnder))).flat(),
  fileURLToPath(new URL('../src/app/App.tsx', import.meta.url)),
  fileURLToPath(new URL('../index.html', import.meta.url)),
].filter((file) => !file.endsWith('publicLabels.ts'));

for (const file of publicUiSourceFiles) {
  const content = await readFile(file, 'utf8');
  for (const phrase of untranslatedPublicTerms) {
    if (content.includes(phrase)) throw new Error(`公開介面仍包含未中文化術語：${phrase}（${file}）`);
  }
  if (/(^|[^A-Z])AI([^A-Z]|$)/u.test(content)) throw new Error(`公開介面仍包含未中文化術語：AI（${file}）`);
}

for (const requiredFile of requiredStaticFiles) {
  const requiredPath = join(distDirectory, requiredFile);
  if (!files.includes(requiredPath)) {
    throw new Error(`公開Build缺少Cloudflare Pages必要檔案：${requiredFile}`);
  }
}

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const publicTextScan = content
    .replaceAll('application/x-www-form-urlencoded', '')
    .replaceAll('application/json', '')
    .replaceAll('application/octet-stream', '');
  for (const phrase of forbidden) {
    if (content.includes(phrase)) {
      throw new Error(`公開Build包含A版專屬內容：${phrase}（${file}）`);
    }
  }
  for (const phrase of engineeringTerms) {
    if (publicTextScan.includes(phrase)) {
      throw new Error(`公開Build包含工程術語：${phrase}（${file}）`);
    }
  }
}

const redirects = await readFile(join(distDirectory, '_redirects'), 'utf8');
const headers = await readFile(join(distDirectory, '_headers'), 'utf8');
const robots = await readFile(join(distDirectory, 'robots.txt'), 'utf8');
if (!redirects.includes('/* /index.html 200')) throw new Error('SPA fallback設定不正確。');
if (!robots.includes('Disallow: /')) throw new Error('robots.txt未阻擋搜尋引擎。');
for (const header of ['X-Robots-Tag:', 'X-Content-Type-Options: nosniff', 'Content-Security-Policy:', 'X-Frame-Options: DENY']) {
  if (!headers.includes(header)) throw new Error(`安全headers缺少：${header}`);
}

const builtCss = (await Promise.all(files.filter((file)=>file.endsWith('.css')).map((file)=>readFile(file,'utf8')))).join('\n');
if (!builtCss.includes('prefers-reduced-motion')) throw new Error('公開Build缺少prefers-reduced-motion減少動畫設定。');

const builtAssets = (await Promise.all(files.filter((file)=>/\.(?:html|js)$/u.test(file)).map((file)=>readFile(file,'utf8')))).join('\n');
for (const phrase of requiredLocalizedCopy) {
  if (!builtAssets.includes(phrase)) throw new Error(`公開Build缺少中文介面文字：${phrase}`);
}

console.log(`公開Build檢查通過：${files.length}個檔案未包含A版內容或公開工程術語，公開介面已全中文化，且SPA fallback、robots與安全headers均存在。`);
