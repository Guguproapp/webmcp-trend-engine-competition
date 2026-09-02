import { createCloudflareRadarAdapter, parseRadarQuery } from '../../../_shared/radar/RadarAdapter';
import { methodNotAllowed, radarError, radarJson, type RadarFunctionEnvironment } from '../../../_shared/radar/http';

const handleGet: PagesFunction<RadarFunctionEnvironment> = async (context) => {
  try {
    const query = parseRadarQuery(new URL(context.request.url));
    const result = await createCloudflareRadarAdapter(context.env, context.request.signal).trends(query);
    return radarJson({ ok: true, kind: 'trends', query, ...result });
  } catch (error) { return radarError(error); }
};

export const onRequest: PagesFunction<RadarFunctionEnvironment> = async (context) => context.request.method === 'GET' ? handleGet(context) : methodNotAllowed();
