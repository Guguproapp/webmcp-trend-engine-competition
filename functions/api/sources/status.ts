import { D1TrendRepository } from '../../_shared/D1TrendRepository';
import { json } from '../../_shared/trendRefresh';

export const onRequestGet: PagesFunction<Env> = async (context) => json({sources:await new D1TrendRepository(context.env.TREND_DB).providerStatuses()});
