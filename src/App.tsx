import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_CMS_DATA, INITIAL_SAMPLE_INQUIRIES } from './data/defaultSeed';
import { InquiryItem, SiteCMSData, UserProfile } from './types/cms';
import { api } from './utils/api';
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [clientPortalOpen, setClientPortalOpen] = useState(false);
  const [ownerStudioOpen, setOwnerStudioOpen] = useState(false);
  const [ownerStudioTab, setOwnerStudioTab] = useState<AdminTab>('hero');
  const [selectedServiceForQuote, setSelectedServiceForQuote] = useState('');

  // Real-time Firebase Cloud Subscriptions (CMS + Orders + Auth)
  useEffect(() => {
    const unsubCMS = api.subscribeCMS((liveCMS) => {
      setCmsData(liveCMS);
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
    if (!currentUser || currentUser.role === 'owner') return 0;
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
      openOwnerTab('hero');
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

  return (
    <div
      className="relative min-h-screen overflow-x-clip text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100"
      style={{ backgroundColor: cmsData.theme.backgroundHex }}
    >
      {/* Clean Background Architectural Atmosphere (Zero Floating Avatar Stages) */}
      <ScrollScene3D
        primaryHex={cmsData.theme.primaryAccent}
        secondaryHex={cmsData.theme.secondaryAccent}
        accentHex={cmsData.theme.tertiaryAccent}
        particleDensity={cmsData.theme.particleDensity}
        scrollSpeed={cmsData.theme.scrollSpeed}
        wireframeOpacity={cmsData.theme.wireframeOpacity}
      />

      {/* Sleek Conversion Navbar */}
      <Navbar
        primaryColor={cmsData.theme.primaryAccent}
        secondaryColor={cmsData.theme.secondaryAccent}
        currentUser={currentUser}
        activeOrdersCount={activeClientOrdersCount}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenPortal={() => setClientPortalOpen(true)}
        onOpenOwnerStudio={() => openOwnerTab('hero')}
        onLogout={handleLogout}
      />

      {/* Main Content Flow: Hero (Single Executive CEO Character) -> Services -> Projects -> Order */}
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
          isOwner={isOwner}
          onSelectServiceForQuote={handleSelectServiceForOrder}
          onManageServices={() => openOwnerTab('services')}
        />

        <ProjectsSection
          projects={cmsData.projects}
          theme={cmsData.theme}
          headingPrefix={cmsData.hero.projectsHeadingPrefix}
          headingHighlight={cmsData.hero.projectsHeadingHighlight}
          subheading={cmsData.hero.projectsSubheading}
          isOwner={isOwner}
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

      {/* Unified Sign-In Modal (Firebase Google Login + Email Auth + Hidden 'admin' / 'admin') */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        primaryColor={cmsData.theme.primaryAccent}
        secondaryColor={cmsData.theme.secondaryAccent}
      />

      {/* Client Workspace Portal (Strictly Services, Projects & Live Order Tracking) */}
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

      {/* Owner Real-Time CMS Dashboard (Unlocked Exclusively by Hidden 'admin' / 'admin') */}
      {isOwner && (
        <AdminCustomizationPanel
          isOpen={ownerStudioOpen}
          initialTab={ownerStudioTab}
          onClose={() => setOwnerStudioOpen(false)}
          cmsData={cmsData}
          orders={orders}
          onCMSUpdated={setCmsData}
        />
      )}
    </div>
  );
}
export default App;
