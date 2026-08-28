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

export function App() {
  return <Routes><Route element={<AppShell />}><Route index element={<Navigate to="/onboarding" replace />} /><Route path="/onboarding" element={<OnboardingStartPage />} /><Route path="/onboarding/existing-accounts" element={<ExistingAccountsPage />} /><Route path="/onboarding/new-accounts" element={<NewAccountsPage />} /><Route path="/onboarding/profile" element={<BrandProfilePage />} /><Route path="/onboarding/progress" element={<OnboardingProgressPage />} /><Route path="/oauth/mock/authorize/:platformCode" element={<MockAuthorizationPage />} /><Route path="/oauth/mock/callback" element={<OAuthCallbackPage />} /><Route path="/settings/connections" element={<ConnectionsPage />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="*" element={<Navigate to="/onboarding" replace />} /></Route></Routes>;
}
