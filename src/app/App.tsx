import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../shared/presentation/AppShell';
import { ProductBoundaryPage } from '../shared/presentation/ProductBoundaryPage';
import { TrendOverviewPage, TrendSearchPage } from '../modules/trend-discovery/presentation/TrendListPages';
import { TrendDetailPage } from '../modules/trend-discovery/presentation/TrendDetailPage';
import { TrendExcludedPage, TrendWatchlistPage } from '../modules/trend-discovery/presentation/TrendCollectionsPages';
import { TrendRulesPage } from '../modules/trend-discovery/presentation/TrendRulesPage';
import { ReviewPage } from '../modules/trend-discovery/presentation/ReviewPage';
import { TrendSourcesPage } from '../modules/trend-discovery/presentation/TrendSourcesPage';

export function App() {
  return <Routes><Route element={<AppShell />}><Route index element={<Navigate to="/review" replace />} /><Route path="/review" element={<ReviewPage />} /><Route path="/trends" element={<TrendOverviewPage />} /><Route path="/trends/search" element={<TrendSearchPage />} /><Route path="/trends/watchlist" element={<TrendWatchlistPage />} /><Route path="/trends/excluded" element={<TrendExcludedPage />} /><Route path="/trends/rules" element={<TrendRulesPage />} /><Route path="/trends/sources" element={<TrendSourcesPage />} /><Route path="/trends/:topicId" element={<TrendDetailPage />} /><Route path="*" element={<ProductBoundaryPage />} /></Route></Routes>;
}
