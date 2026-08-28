import { json, trendResponse } from '../../_shared/trendRefresh';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try { return json(await trendResponse(context.env,context)); }
  catch (error) { console.error(JSON.stringify({event:'trends.read_failed',message:error instanceof Error?error.message:'unknown'})); return json({topics:[],metadata:{dataState:'empty',lastSuccessAt:null,lastAttemptAt:new Date().toISOString(),nextRetryAt:null,isRefreshing:false,sourceStatuses:[],message:'熱門情報暫時無法讀取。'}},503); }
};
