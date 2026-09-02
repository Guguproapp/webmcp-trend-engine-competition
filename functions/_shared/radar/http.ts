import { RadarAdapterError } from './RadarAdapter';

const headers = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export interface RadarFunctionEnvironment {
  RADAR_API_BASE_URL?: string;
  RADAR_PROGRAM_API_TOKEN?: string;
}

export function radarJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers });
}

export function radarError(error: unknown): Response {
  if (error instanceof RadarAdapterError) return radarJson({ ok: false, error: { code: error.code, message: error.message } }, error.status);
  return radarJson({ ok: false, error: { code: 'internal_error', message: '熱門雷達查詢暫時無法完成。' } }, 500);
}

export function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ ok: false, error: { code: 'method_not_allowed', message: '這個端點只提供唯讀查詢。' } }), { status: 405, headers: { ...headers, Allow: 'GET' } });
}
