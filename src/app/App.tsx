import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../shared/presentation/AppShell';
import { ProductBoundaryPage } from '../shared/presentation/ProductBoundaryPage';
import { TrendOverviewPage, TrendSearchPage } from '../modules/trend-discovery/presentation/TrendListPages';
import { TrendDetailPage } from '../modules/trend-discovery/presentation/TrendDetailPage';
import { TrendExcludedPage, TrendWatchlistPage } from '../modules/trend-discovery/presentation/TrendCollectionsPages';
import { TrendRulesPage } from '../modules/trend-discovery/presentation/TrendRulesPage';
import { ProductHomePage } from '../modules/trend-discovery/presentation/ProductHomePage';
import { GuidePage } from '../modules/trend-discovery/presentation/GuidePage';
import { TrendSourcesPage } from '../modules/trend-discovery/presentation/TrendSourcesPage';
import { VideoSearchPage } from '../modules/trend-discovery/presentation/VideoSearchPage';

export function App() {
  return <Routes><Route element={<AppShell />}><Route index element={<ProductHomePage />} /><Route path="/guide" element={<GuidePage />} /><Route path="/review" element={<Navigate to="/" replace />} /><Route path="/trends" element={<TrendOverviewPage />} /><Route path="/trends/search" element={<TrendSearchPage />} /><Route path="/trends/video-search" element={<VideoSearchPage />} /><Route path="/trends/watchlist" element={<TrendWatchlistPage />} /><Route path="/trends/excluded" element={<TrendExcludedPage />} /><Route path="/trends/rules" element={<TrendRulesPage />} /><Route path="/trends/sources" element={<TrendSourcesPage />} /><Route path="/trends/:topicId" element={<TrendDetailPage />} /><Route path="*" element={<ProductBoundaryPage />} /></Route></Routes>;
}
