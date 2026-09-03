import { describe, expect, it } from 'vitest';
import {
  isSensitiveQueryName, parsePublicHttpsUrl, PRIVATE_URL_WARNING_EN, PRIVATE_URL_WARNING_ZH,
  PublicUrlSafetyError, safePublicHttpsUrl,
  containsSensitiveText, redactSensitiveText, sanitizeUntrustedPublicData,
} from './PublicUrlSafety';

describe('公開HTTPS網址安全門檻', () => {
  it('允許一般公開HTTPS網址與必要的影片查詢參數', () => {
    expect(parsePublicHttpsUrl('https://www.youtube.com/watch?v=abcDEF123').toString()).toBe('https://www.youtube.com/watch?v=abcDEF123');
  });

  it.each([
    'http://example.com/public',
    'https://user:password@example.com/public',
    'https://example.com/public#private-fragment',
    'https://example.com/public?token=NOT_A_REAL_TOKEN',
    'https://example.com/public?access_token=NOT_A_REAL_TOKEN',
    'https://example.com/public?refresh_token=NOT_A_REAL_TOKEN',
    'https://example.com/public?api_key=NOT_A_REAL_KEY',
    'https://example.com/public?apikey=NOT_A_REAL_KEY',
    'https://example.com/public?signature=NOT_A_REAL_SIGNATURE',
    'https://example.com/public?sig=NOT_A_REAL_SIGNATURE',
    'https://example.com/public?X-Amz-Signature=NOT_A_REAL_SIGNATURE',
    'https://example.com/public?GoogleAccessId=NOT_A_REAL_ID',
    'https://example.com/public?AcCeSs-ToKeN=NOT_A_REAL_TOKEN',
    'https://example.com/public?accessToken=NOT_A_REAL_TOKEN',
    'https://example.com/public?refreshToken=NOT_A_REAL_TOKEN',
    'https://example.com/public?sessionId=NOT_A_REAL_SESSION',
    'https://example.com/public?resourcekey=NOT_A_REAL_KEY',
    'https://localhost/private',
    'https://127.0.0.1/private',
    'https://192.168.1.10/private',
    'https://[::1]/private',
    'https://[::]/private',
    'https://[::ffff:127.0.0.1]/private',
    'https://192.0.2.1/private',
    'https://198.51.100.1/private',
    'https://203.0.113.1/private',
  ])('拒絕含私人存取資訊的網址：%s', (url) => {
    expect(() => parsePublicHttpsUrl(url)).toThrow(PublicUrlSafetyError);
    expect(safePublicHttpsUrl(url)).toBeNull();
  });

  it('大小寫及分隔符變形仍視為敏感參數', () => {
    expect(isSensitiveQueryName('Access-Token')).toBe(true);
    expect(isSensitiveQueryName('X-AMZ-Credential')).toBe(true);
    expect(isSensitiveQueryName('x-goog-signature')).toBe(true);
    expect(isSensitiveQueryName('video_id')).toBe(false);
  });

  it('中英文拒絕說明固定且不回顯輸入值', () => {
    expect(PRIVATE_URL_WARNING_ZH).toBe('此網址可能包含私人存取權限或安全憑證，系統不會保存。請改用不含私人參數的公開網址。');
    expect(PRIVATE_URL_WARNING_EN).toBe('This URL may contain private access permissions or security credentials and will not be stored. Please use a public URL without private parameters.');
  });

  it('從未受信任文字與物件移除敏感值', () => {
    const marker = 'NOT_A_REAL_SECRET';
    const result = sanitizeUntrustedPublicData({ title:`source https://example.com/file?access_token=${marker}`, token:marker, nested:{ note:`Bearer ${marker}` } });
    expect(JSON.stringify(result)).not.toContain(marker);
    expect(redactSensitiveText(`signature=${marker}`)).toBe('signature=[redacted]');
  });

  it.each(['auth','code','key','nonce','GoogleAccessId','accessToken','refreshToken','sessionId','X-Amz-Credential','xGoogSignature'])('文字欄位使用與URL相同的敏感名稱阻擋：%s', (name) => {
    const marker='NOT_A_REAL_SECRET'; const input=`${name}=${marker}`;
    expect(containsSensitiveText(input)).toBe(true);
    expect(redactSensitiveText(input)).not.toContain(marker);
  });

  it('不移除應用程式合法使用的key與code資料欄位', () => {
    expect(sanitizeUntrustedPublicData({key:'score_component',code:'source_status'})).toEqual({key:'score_component',code:'source_status'});
  });
});
