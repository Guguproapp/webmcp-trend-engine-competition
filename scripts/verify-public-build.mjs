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
for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const phrase of forbidden) {
    if (content.includes(phrase)) {
      throw new Error(`公開Build包含A版專屬內容：${phrase}（${file}）`);
    }
  }
}

console.log(`公開Build隔離檢查通過：${files.length}個檔案未包含A版專屬路由、頁面或文案。`);
