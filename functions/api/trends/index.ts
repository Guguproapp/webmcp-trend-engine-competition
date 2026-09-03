import { json, trendResponse } from '../../_shared/trendRefresh';
import { sanitizeUntrustedPublicData } from '../../../src/shared/security/PublicUrlSafety';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try { return json(sanitizeUntrustedPublicData(await trendResponse(context.env,context))); }
  catch { console.error(JSON.stringify({event:'trends.read_failed',code:'safe_upstream_failure'})); return json({topics:[],metadata:{dataState:'empty',lastSuccessAt:null,lastAttemptAt:new Date().toISOString(),nextRetryAt:null,isRefreshing:false,sourceStatuses:[],message:'熱門情報暫時無法讀取。'}},503); }
};
