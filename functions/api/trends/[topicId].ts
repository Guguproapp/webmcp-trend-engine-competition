import { D1TrendRepository } from '../../_shared/D1TrendRepository';
import { json } from '../../_shared/trendRefresh';

export const onRequestGet: PagesFunction<Env,'topicId'> = async (context) => {
  const topic=(await new D1TrendRepository(context.env.TREND_DB).listTopics()).find((item)=>item.id===context.params.topicId);
  return topic?json({topic}):json({message:'找不到指定主題。'},404);
};
