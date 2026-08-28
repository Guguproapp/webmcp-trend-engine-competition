import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../shared/presentation/AppShell';
import { ProductBoundaryPage } from '../shared/presentation/ProductBoundaryPage';
import { TrendOverviewPage, TrendSearchPage } from '../modules/trend-discovery/presentation/TrendListPages';
import { TrendDetailPage } from '../modules/trend-discovery/presentation/TrendDetailPage';
import { TrendExcludedPage, TrendWatchlistPage } from '../modules/trend-discovery/presentation/TrendCollectionsPages';
import { TrendRulesPage } from '../modules/trend-discovery/presentation/TrendRulesPage';
import { TrendPageEmpty } from '../modules/trend-discovery/presentation/TrendComponents';

export function App() {
  return <Routes><Route element={<AppShell />}><Route index element={<Navigate to="/trends" replace />} /><Route path="/trends" element={<TrendOverviewPage />} /><Route path="/trends/search" element={<TrendSearchPage />} /><Route path="/trends/watchlist" element={<TrendWatchlistPage />} /><Route path="/trends/excluded" element={<TrendExcludedPage />} /><Route path="/trends/rules" element={<TrendRulesPage />} /><Route path="/trends/sources" element={<TrendPageEmpty title="資料來源" description="正式來源連接尚未開放；工作包 002B 只使用 MockTrendSourceProvider。" />} /><Route path="/trends/:topicId" element={<TrendDetailPage />} /><Route path="*" element={<ProductBoundaryPage />} /></Route></Routes>;
}
