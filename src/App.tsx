import React, { useEffect, useState } from 'react';
import { Sliders } from 'lucide-react';
import { DEFAULT_CMS_DATA } from './data/defaultSeed';
import { AvatarConfig, InquiryItem, SiteCMSData, UserProfile } from './types/cms';
import { api, getStoredToken, setStoredToken } from './utils/api';
import { SpeechFrameState, speechEngine } from './utils/speechEngine';
import { ScrollScene3D } from './components/three/ScrollScene3D';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { AvatarStudioSection } from './components/AvatarStudioSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ContactQuoteSection } from './components/ContactQuoteSection';
import { AuthModal } from './components/AuthModal';
import { ClientPortalModal } from './components/ClientPortalModal';
import { AdminCustomizationPanel, AdminTabId } from './components/AdminCustomizationPanel';

export const App: React.FC = () => {
  const [cmsData, setCmsData] = useState<SiteCMSData>(DEFAULT_CMS_DATA);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [speechState, setSpeechState] = useState<SpeechFrameState>(speechEngine.getState());

  // Modals & Drawers
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [clientPortalOpen, setClientPortalOpen] = useState(false);
  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTabId>('hero');
  const [elevationBanner, setElevationBanner] = useState<string>('');

  // Inquiries & Service Quote Selection
  const [ownerInquiries, setOwnerInquiries] = useState<InquiryItem[]>([]);
  const [preselectedService, setPreselectedService] = useState<string>(
    DEFAULT_CMS_DATA.services[0]?.title || ''
  );

  // Subscribe to real-time 60fps Avatar Speech & Viseme Engine
  useEffect(() => {
    const unsub = speechEngine.subscribe((next) => setSpeechState(next));
    // Warm up speechSynthesis voice registry on mount
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    return unsub;
  }, []);

  // Hydrate Dynamic CMS Data & Restore Authenticated Session
  useEffect(() => {
    api
      .getCMS()
      .then((remote) => {
        setCmsData(remote);
      })
      .catch(() => {
        // Fallback to local seed seamlessly
      });

    if (getStoredToken()) {
      api
        .getMe()
        .then((res) => {
          if (res.user) {
            setCurrentUser(res.user);
            if (res.user.role === 'owner') {
              api
                .getAllInquiries()
                .then((r) => setOwnerInquiries(r.inquiries))
                .catch(() => {});
            }
          } else {
            setStoredToken(null);
          }
        })
        .catch(() => {
          setStoredToken(null);
        });
    }
  }, []);

  const isOwner = currentUser?.role === 'owner';

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'owner') {
      api
        .getAllInquiries()
        .then((r) => setOwnerInquiries(r.inquiries))
        .catch(() => {});
      setElevationBanner(
        `Welcome back, ${user.displayName} — Full Dynamic Platform Control Unlocked.`
      );
      setTimeout(() => setElevationBanner(''), 5000);
      setAdminActiveTab('hero');
      setAdminDrawerOpen(true);
    } else {
      setClientPortalOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setStoredToken(null);
    setCurrentUser(null);
    setAdminDrawerOpen(false);
    setClientPortalOpen(false);
  };

  const handleAvatarLiveChange = (nextAvatar: AvatarConfig) => {
    setCmsData((prev) => ({
      ...prev,
      avatar: nextAvatar,
    }));
  };

  const handleSaveGlobalAvatar = async (nextAvatar: AvatarConfig) => {
    const res = await api.updateAvatar(nextAvatar);
    setCmsData((prev) => ({
      ...prev,
      avatar: res.avatar,
    }));
  };

  const handleSelectServiceForQuote = (serviceTitle: string) => {
    setPreselectedService(serviceTitle);
    const contactEl = document.getElementById('contact');
    contactEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const openOwnerTab = (tab: AdminTabId) => {
    setAdminActiveTab(tab);
    setAdminDrawerOpen(true);
  };

  const unreadLeadsCount = ownerInquiries.filter((i) => i.status === 'new').length;

  return (
    <div className="relative min-h-screen text-slate-100 selection:bg-cyan-500/30">
      {/* Scroll-Driven Dynamic 3D Background Canvas & Lighting Morph */}
      <ScrollScene3D theme={cmsData.theme} />

      {/* Top Glassmorphic Navigation Bar */}
      <Navbar
        hero={cmsData.hero}
        theme={cmsData.theme}
        currentUser={currentUser}
        unreadInquiriesCount={unreadLeadsCount}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenClientPortal={() => setClientPortalOpen(true)}
        onOpenAdminPanel={() => openOwnerTab('hero')}
        onLogout={handleLogout}
      />

      {/* Discreet Owner Elevation Toast */}
      {elevationBanner && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md px-5 py-3.5 rounded-2xl bg-slate-900/95 border border-cyan-400/50 text-xs sm:text-sm font-medium text-cyan-200 shadow-2xl backdrop-blur-xl">
          {elevationBanner}
        </div>
      )}

      {/* Floating Silent Owner Quick-Access Trigger (Strictly ONLY rendered when Owner is signed in) */}
      {isOwner && !adminDrawerOpen && (
        <button
          type="button"
          onClick={() => openOwnerTab('hero')}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-display font-bold text-sm text-slate-950 shadow-[0_12px_40px_rgba(6,182,212,0.5)] hover:scale-105 transition-transform"
          style={{
            background: `linear-gradient(135deg, ${cmsData.theme.primaryAccent}, ${cmsData.theme.secondaryAccent})`,
          }}
        >
          <Sliders className="w-4 h-4" />
          <span>Customize SwiftStack</span>
        </button>
      )}

      {/* Main Public & Interactive Sections */}
      <main>
        <HeroSection
          hero={cmsData.hero}
          theme={cmsData.theme}
          avatarConfig={cmsData.avatar}
          speechState={speechState}
          isOwner={isOwner}
          onQuickEditHero={() => openOwnerTab('hero')}
        />

        <ServicesSection
          services={cmsData.services}
          theme={cmsData.theme}
          isOwner={isOwner}
          onSelectServiceForQuote={handleSelectServiceForQuote}
          onManageServices={() => openOwnerTab('services')}
        />

        <AvatarStudioSection
          avatarConfig={cmsData.avatar}
          onChangeAvatar={handleAvatarLiveChange}
          onSaveGlobalAvatar={isOwner ? handleSaveGlobalAvatar : undefined}
          voiceScript={cmsData.hero.voiceGreetingScript}
          speechState={speechState}
          theme={cmsData.theme}
          isOwner={isOwner}
        />

        <ProjectsSection
          projects={cmsData.projects}
          theme={cmsData.theme}
          isOwner={isOwner}
          onManageProjects={() => openOwnerTab('projects')}
          onStartSimilarProject={(title) =>
            handleSelectServiceForQuote(`Custom Architecture (${title})`)
          }
        />

        <ContactQuoteSection
          hero={cmsData.hero}
          theme={cmsData.theme}
          services={cmsData.services}
          preselectedService={preselectedService}
          currentUser={currentUser}
          onInquiryCreated={() => {
            if (isOwner) {
              api
                .getAllInquiries()
                .then((r) => setOwnerInquiries(r.inquiries))
                .catch(() => {});
            }
          }}
        />
      </main>

      {/* Unified Secure Sign-In / Continue Modal */}
      <AuthModal
        open={authModalOpen}
        hero={cmsData.hero}
        theme={cmsData.theme}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

      {/* Client Portal Modal (Profile & Project Requests) */}
      <ClientPortalModal
        open={clientPortalOpen}
        user={currentUser}
        services={cmsData.services}
        theme={cmsData.theme}
        onClose={() => setClientPortalOpen(false)}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* Hidden Owner Customization Control Studio (Strictly mounted ONLY when authenticated as Owner) */}
      {isOwner && (
        <AdminCustomizationPanel
          open={adminDrawerOpen}
          initialTab={adminActiveTab}
          cmsData={cmsData}
          inquiries={ownerInquiries}
          onClose={() => setAdminDrawerOpen(false)}
          onCMSChange={setCmsData}
          onInquiriesChange={setOwnerInquiries}
        />
      )}
    </div>
  );
};

export default App;
