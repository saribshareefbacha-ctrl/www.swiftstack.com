import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_CMS_DATA, INITIAL_SAMPLE_INQUIRIES } from './data/defaultSeed';
import { InquiryItem, SiteCMSData, ThemeMode, UserProfile } from './types/cms';
import { api, getSavedThemeMode, saveThemeMode } from './utils/api';
import { syncDocumentBranding } from './utils/branding';
import { ScrollScene3D } from './components/three/ScrollScene3D';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ContactQuoteSection } from './components/ContactQuoteSection';
import { AuthModal } from './components/AuthModal';
import { ClientPortalModal } from './components/ClientPortalModal';
import { AdminCustomizationPanel, AdminTab } from './components/AdminCustomizationPanel';

export function App() {
  const [cmsData, setCmsData] = useState<SiteCMSData>(DEFAULT_CMS_DATA);
  const [orders, setOrders] = useState<InquiryItem[]>(INITIAL_SAMPLE_INQUIRIES);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => getSavedThemeMode() || DEFAULT_CMS_DATA.theme.defaultMode || 'glass'
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [clientPortalOpen, setClientPortalOpen] = useState(false);
  const [ownerStudioOpen, setOwnerStudioOpen] = useState(false);
  const [ownerStudioTab, setOwnerStudioTab] = useState<AdminTab>('branding');
  const [selectedServiceForQuote, setSelectedServiceForQuote] = useState('');

  // Apply theme mode to <html> attribute
  useEffect(() => {
    saveThemeMode(themeMode);
  }, [themeMode]);

  // Real-time synchronize document <title>, <meta name="description"> & glowing Favicon
  useEffect(() => {
    syncDocumentBranding(cmsData.branding, cmsData.theme);
  }, [cmsData.branding, cmsData.theme]);

  // Real-time Firebase Cloud Subscriptions (CMS + Orders + Persisted Auth)
  useEffect(() => {
    const unsubCMS = api.subscribeCMS((liveCMS) => {
      setCmsData(liveCMS);
      if (!getSavedThemeMode() && liveCMS.theme?.defaultMode) {
        setThemeMode(liveCMS.theme.defaultMode);
      }
    });
    const unsubOrders = api.subscribeOrders((liveOrders) => {
      setOrders(liveOrders);
    });
    const unsubAuth = api.subscribeAuth((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubCMS();
      unsubOrders();
      unsubAuth();
    };
  }, []);

  const activeClientOrdersCount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'client') return 0;
    const emailClean = (currentUser.email || '').toLowerCase();
    return orders.filter(
      (o) =>
        o.clientId === currentUser.id ||
        (emailClean && o.clientEmail.toLowerCase() === emailClean)
    ).length;
  }, [orders, currentUser]);

  const openOwnerTab = (tab: AdminTab) => {
    setOwnerStudioTab(tab);
    setOwnerStudioOpen(true);
  };

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'owner') {
      openOwnerTab('branding');
    } else if (user.role === 'subadmin') {
      openOwnerTab('services');
    } else {
      setClientPortalOpen(true);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setOwnerStudioOpen(false);
    setClientPortalOpen(false);
  };

  const scrollToSection = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectServiceForOrder = (serviceTitle: string) => {
    setSelectedServiceForQuote(serviceTitle);
    scrollToSection('#order');
  };

  const isOwner = currentUser?.role === 'owner';
  const isStaff = isOwner || currentUser?.role === 'subadmin';

  return (
    <div className="relative min-h-screen overflow-x-clip selection:bg-cyan-500/30">
      {/* Multi-Theme Reactive 3D Ambient Background */}
      <ScrollScene3D
        themeMode={themeMode}
        primaryHex={cmsData.theme.primaryAccent}
        secondaryHex={cmsData.theme.secondaryAccent}
        accentHex={cmsData.theme.tertiaryAccent}
        particleDensity={cmsData.theme.particleDensity}
        scrollSpeed={cmsData.theme.scrollSpeed}
        wireframeOpacity={cmsData.theme.wireframeOpacity}
      />

      {/* Sleek Conversion Navbar with Glowing Profile Badge & 4-Mode Theme Switcher */}
      <Navbar
        primaryColor={cmsData.theme.primaryAccent}
        secondaryColor={cmsData.theme.secondaryAccent}
        companyName={cmsData.hero.companyName}
        monogram={cmsData.branding.faviconMonogram || cmsData.hero.companyAbbreviation}
        profileIconUrl={cmsData.branding.profileIconUrl}
        themeMode={themeMode}
        onChangeThemeMode={setThemeMode}
        currentUser={currentUser}
        activeOrdersCount={activeClientOrdersCount}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenPortal={() => setClientPortalOpen(true)}
        onOpenOwnerStudio={() => openOwnerTab(isOwner ? 'branding' : 'services')}
        onLogout={handleLogout}
      />

      {/* Main Content Flow */}
      <main className="relative z-10">
        <HeroSection
          hero={cmsData.hero}
          character={cmsData.character}
          primaryColor={cmsData.theme.primaryAccent}
          secondaryColor={cmsData.theme.secondaryAccent}
          isOwner={isOwner}
          onExploreWork={() => scrollToSection('#projects')}
          onStartOrder={() => scrollToSection('#order')}
          onEditCharacter={() => openOwnerTab('character')}
        />

        <ServicesSection
          services={cmsData.services}
          theme={cmsData.theme}
          headingPrefix={cmsData.hero.servicesHeadingPrefix}
          headingHighlight={cmsData.hero.servicesHeadingHighlight}
          subheading={cmsData.hero.servicesSubheading}
          isOwner={isStaff}
          onSelectServiceForQuote={handleSelectServiceForOrder}
          onManageServices={() => openOwnerTab('services')}
        />

        <ProjectsSection
          projects={cmsData.projects}
          theme={cmsData.theme}
          headingPrefix={cmsData.hero.projectsHeadingPrefix}
          headingHighlight={cmsData.hero.projectsHeadingHighlight}
          subheading={cmsData.hero.projectsSubheading}
          isOwner={isStaff}
          onManageProjects={() => openOwnerTab('projects')}
          onStartSimilarProject={(projectTitle) =>
            handleSelectServiceForOrder(`Similar to: ${projectTitle}`)
          }
        />

        <ContactQuoteSection
          hero={cmsData.hero}
          theme={cmsData.theme}
          services={cmsData.services}
          preselectedService={selectedServiceForQuote}
          currentUser={currentUser}
        />
      </main>

      {/* Unified Sign-In Modal (Google OAuth + Remember Me + Eye Toggles + Multi-Role Elevation) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        primaryColor={cmsData.theme.primaryAccent}
        secondaryColor={cmsData.theme.secondaryAccent}
        companyName={cmsData.hero.companyName}
        monogram={cmsData.branding.faviconMonogram || cmsData.hero.companyAbbreviation}
        profileIconUrl={cmsData.branding.profileIconUrl}
      />

      {/* Sleek Client Portal */}
      {currentUser && currentUser.role === 'client' && (
        <ClientPortalModal
          isOpen={clientPortalOpen}
          onClose={() => setClientPortalOpen(false)}
          user={currentUser}
          services={cmsData.services}
          projects={cmsData.projects}
          allOrders={orders}
          onUserUpdated={setCurrentUser}
          primaryColor={cmsData.theme.primaryAccent}
        />
      )}

      {/* Multi-Tier Master Owner & Restricted Sub-Admin CMS Dashboard */}
      {currentUser && isStaff && (
        <AdminCustomizationPanel
          isOpen={ownerStudioOpen}
          initialTab={ownerStudioTab}
          currentUser={currentUser}
          onClose={() => setOwnerStudioOpen(false)}
          cmsData={cmsData}
          orders={orders}
          onCMSUpdated={setCmsData}
          onChangeThemeMode={setThemeMode}
        />
      )}
    </div>
  );
}
export default App;
