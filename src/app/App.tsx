import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '../modules/dashboard/presentation/DashboardPage';
import { BrandProfilePage } from '../modules/brand-profile/presentation/BrandProfilePage';
import { ExistingAccountsPage } from '../modules/account-onboarding/presentation/ExistingAccountsPage';
import { NewAccountsPage } from '../modules/account-onboarding/presentation/NewAccountsPage';
import { OnboardingProgressPage } from '../modules/account-onboarding/presentation/OnboardingProgressPage';
import { OnboardingStartPage } from '../modules/account-onboarding/presentation/OnboardingStartPage';
import { ConnectionsPage } from '../modules/platform-connections/presentation/ConnectionsPage';
import { MockAuthorizationPage } from '../modules/platform-connections/presentation/MockAuthorizationPage';
import { OAuthCallbackPage } from '../modules/platform-connections/presentation/OAuthCallbackPage';
import { AppShell } from '../shared/presentation/AppShell';
import { TrendOverviewPage, TrendSearchPage } from '../modules/trend-discovery/presentation/TrendListPages';
import { TrendDetailPage } from '../modules/trend-discovery/presentation/TrendDetailPage';
import { TrendExcludedPage, TrendWatchlistPage } from '../modules/trend-discovery/presentation/TrendCollectionsPages';
import { TrendRulesPage } from '../modules/trend-discovery/presentation/TrendRulesPage';
import { TrendPageEmpty } from '../modules/trend-discovery/presentation/TrendComponents';

export function App() {
  return <Routes><Route element={<AppShell />}><Route index element={<Navigate to="/trends" replace />} /><Route path="/trends" element={<TrendOverviewPage />} /><Route path="/trends/search" element={<TrendSearchPage />} /><Route path="/trends/watchlist" element={<TrendWatchlistPage />} /><Route path="/trends/excluded" element={<TrendExcludedPage />} /><Route path="/trends/rules" element={<TrendRulesPage />} /><Route path="/trends/sources" element={<TrendPageEmpty title="資料來源" description="正式來源連接尚未開放；工作包 002 只使用 MockTrendSourceProvider。" />} /><Route path="/trends/:topicId" element={<TrendDetailPage />} /><Route path="/onboarding" element={<OnboardingStartPage />} /><Route path="/onboarding/existing-accounts" element={<ExistingAccountsPage />} /><Route path="/onboarding/new-accounts" element={<NewAccountsPage />} /><Route path="/onboarding/profile" element={<BrandProfilePage />} /><Route path="/onboarding/progress" element={<OnboardingProgressPage />} /><Route path="/oauth/mock/authorize/:platformCode" element={<MockAuthorizationPage />} /><Route path="/oauth/mock/callback" element={<OAuthCallbackPage />} /><Route path="/settings/connections" element={<ConnectionsPage />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="*" element={<Navigate to="/trends" replace />} /></Route></Routes>;
}
