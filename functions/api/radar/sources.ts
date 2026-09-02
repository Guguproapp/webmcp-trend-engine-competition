import { createCloudflareRadarAdapter } from '../../_shared/radar/RadarAdapter';
import { methodNotAllowed, radarError, radarJson, type RadarFunctionEnvironment } from '../../_shared/radar/http';

const handleGet: PagesFunction<RadarFunctionEnvironment> = async (context) => {
  try { return radarJson({ ok: true, kind: 'sources', query: {}, ...await createCloudflareRadarAdapter(context.env, context.request.signal).sources() }); }
  catch (error) { return radarError(error); }
};
export const onRequest: PagesFunction<RadarFunctionEnvironment> = async (context) => context.request.method === 'GET' ? handleGet(context) : methodNotAllowed();
