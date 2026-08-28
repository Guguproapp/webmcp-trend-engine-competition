import { json, refreshTrendData, secureTokenMatches } from '../../_shared/trendRefresh';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authorization=context.request.headers.get('authorization');
  const token=authorization?.startsWith('Bearer ')?authorization.slice(7):undefined;
  if(!await secureTokenMatches(token,context.env.REFRESH_ADMIN_TOKEN))return json({message:'沒有管理更新權限。'},401);
  const result=await refreshTrendData(context.env,fetch,new Date());
  return json({refreshed:result.refreshed,locked:result.locked,topicCount:result.topics.length});
};
