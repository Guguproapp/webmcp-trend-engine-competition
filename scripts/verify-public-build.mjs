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

for (const requiredFile of requiredStaticFiles) {
  const requiredPath = join(distDirectory, requiredFile);
  if (!files.includes(requiredPath)) {
    throw new Error(`公開Build缺少Cloudflare Pages必要檔案：${requiredFile}`);
  }
}

for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const phrase of forbidden) {
    if (content.includes(phrase)) {
      throw new Error(`公開Build包含A版專屬內容：${phrase}（${file}）`);
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

console.log(`公開Build檢查通過：${files.length}個檔案未包含A版內容，且SPA fallback、robots與安全headers均存在。`);
