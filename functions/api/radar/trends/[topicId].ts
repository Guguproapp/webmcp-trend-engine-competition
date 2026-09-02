import { createCloudflareRadarAdapter, validateRadarTopicId } from '../../../_shared/radar/RadarAdapter';
import { methodNotAllowed, radarError, radarJson, type RadarFunctionEnvironment } from '../../../_shared/radar/http';

const handleGet: PagesFunction<RadarFunctionEnvironment, 'topicId'> = async (context) => {
  try {
    const topicId = validateRadarTopicId(String(context.params.topicId ?? ''));
    const result = await createCloudflareRadarAdapter(context.env, context.request.signal).trend(topicId);
    return radarJson({ ok: true, kind: 'trend', query: { topicId }, ...result });
  } catch (error) { return radarError(error); }
};

export const onRequest: PagesFunction<RadarFunctionEnvironment, 'topicId'> = async (context) => context.request.method === 'GET' ? handleGet(context) : methodNotAllowed();
