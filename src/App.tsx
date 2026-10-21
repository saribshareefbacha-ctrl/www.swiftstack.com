import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_CMS_DATA, INITIAL_SAMPLE_INQUIRIES } from './data/defaultSeed';
import {
  CartItem,
  InquiryItem,
  ServiceItem,
  SiteCMSData,
  ThemeMode,
  UserProfile,
  VoiceEngineConfig,
} from './types/cms';
import {
  api,
  getSavedCart,
  getSavedThemeMode,
  saveCart,
  saveThemeMode,
} from './utils/api';
import { syncDocumentBranding } from './utils/branding';
import { FuturisticRobotCanvas } from './components/FuturisticRobotCanvas';
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
  const [cart, setCart] = useState<CartItem[]>(() => getSavedCart());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => getSavedThemeMode() || DEFAULT_CMS_DATA.theme.defaultMode || 'glass'
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [clientPortalOpen, setClientPortalOpen] = useState(false);
  const [clientPortalTab, setClientPortalTab] = useState<
    'cart' | 'orders' | 'new-order' | 'services' | 'projects' | 'profile'
  >('orders');
  const [ownerStudioOpen, setOwnerStudioOpen] = useState(false);
  const [ownerStudioTab, setOwnerStudioTab] = useState<AdminTab>('branding');
  const [selectedServiceForQuote, setSelectedServiceForQuote] = useState('');

  // Sync theme mode to <html data-theme="...">
  useEffect(() => {
    saveThemeMode(themeMode);
  }, [themeMode]);

  // Persist shopping cart
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  // Live update browser <title>, <meta name="description"> & glowing Favicon
  useEffect(() => {
    syncDocumentBranding(cmsData.branding, cmsData.theme);
  }, [cmsData.branding, cmsData.theme]);

  // Real-time Firebase Cloud Subscriptions
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

  const totalCartItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const activeClientOrdersCount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'client') return 0;
    const emailClean = (currentUser.email || '').toLowerCase();
    return orders.filter(
      (o) =>
        o.clientId === currentUser.id ||
        (emailClean && o.clientEmail.toLowerCase() === emailClean)
    ).length;
  }, [orders, currentUser]);

  const handleAddToCart = (service: ServiceItem) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.serviceId === service.id);
      if (exists) {
        return prev.map((i) =>
          i.serviceId === service.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          serviceId: service.id,
          title: service.title,
          category: service.category,
          priceLabel: service.priceLabel,
          basePriceUsd: service.basePriceUsd,
          turnaround: service.turnaround,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateCartQty = (serviceId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.serviceId === serviceId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleClearCart = () => setCart([]);

  const handleVoiceConfigChange = (nextVoice: VoiceEngineConfig) => {
    setCmsData((prev) => ({ ...prev, voice: nextVoice }));
    if (currentUser?.role === 'owner') {
      api.updateVoice(nextVoice).catch(() => {});
    }
  };

  const openOwnerTab = (tab: AdminTab) => {
    setOwnerStudioTab(tab);
    setOwnerStudioOpen(true);
  };

  const scrollToSection = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenCart = () => {
    if (currentUser && currentUser.role === 'client') {
      setClientPortalTab('cart');
      setClientPortalOpen(true);
    } else {
      scrollToSection('#order');
    }
  };

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'owner') {
      openOwnerTab('branding');
    } else if (user.role === 'subadmin') {
      openOwnerTab('services');
    } else {
      setClientPortalTab(cart.length > 0 ? 'cart' : 'orders');
      setClientPortalOpen(true);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setOwnerStudioOpen(false);
    setClientPortalOpen(false);
  };

  const handleSelectServiceForOrder = (serviceTitle: string) => {
    setSelectedServiceForQuote(serviceTitle);
    scrollToSection('#order');
  };

  const isOwner = currentUser?.role === 'owner';
  const isStaff = isOwner || currentUser?.role === 'subadmin';

  return (
    <div className="relative min-h-screen overflow-x-clip selection:bg-cyan-500/25">
      {/* Interactive Futuristic Background Robot Canvas + Human/Robot Index Finger Touch Ripple */}
      <FuturisticRobotCanvas
        themeMode={themeMode}
        primaryHex={cmsData.theme.primaryAccent}
        secondaryHex={cmsData.theme.secondaryAccent}
        accentHex={cmsData.theme.tertiaryAccent}
        robotDensity={cmsData.theme.robotDensity}
        rippleIntensity={cmsData.theme.rippleIntensity}
      />

      {/* Pure Transparent Frosted Glass Navbar */}
      <Navbar
        primaryColor={cmsData.theme.primaryAccent}
        secondaryColor={cmsData.theme.secondaryAccent}
        companyName={cmsData.hero.companyName}
        monogram={cmsData.branding.faviconMonogram || cmsData.hero.companyAbbreviation}
        profileIconUrl={cmsData.branding.profileIconUrl}
        themeMode={themeMode}
        onChangeThemeMode={setThemeMode}
        cartCount={totalCartItems}
        onOpenCart={handleOpenCart}
        currentUser={currentUser}
        activeOrdersCount={activeClientOrdersCount}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenPortal={() => {
          setClientPortalTab('orders');
          setClientPortalOpen(true);
        }}
        onOpenOwnerStudio={() => openOwnerTab(isOwner ? 'branding' : 'services')}
        onLogout={handleLogout}
      />

      {/* Main Content Flow (Strictly Zero 3D/2D Characters Anywhere) */}
      <main className="relative z-10">
        <HeroSection
          hero={cmsData.hero}
          voiceConfig={cmsData.voice}
          primaryColor={cmsData.theme.primaryAccent}
          secondaryColor={cmsData.theme.secondaryAccent}
          isOwner={isOwner}
          onVoiceConfigChange={handleVoiceConfigChange}
          onExploreWork={() => scrollToSection('#projects')}
          onStartOrder={() => scrollToSection('#services')}
          onOpenVoiceCMS={() => openOwnerTab('voice')}
        />

        <ServicesSection
          services={cmsData.services}
          theme={cmsData.theme}
          cart={cart}
          headingPrefix={cmsData.hero.servicesHeadingPrefix}
          headingHighlight={cmsData.hero.servicesHeadingHighlight}
          subheading={cmsData.hero.servicesSubheading}
          isOwner={isStaff}
          onAddToCart={handleAddToCart}
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
          cart={cart}
          onUpdateCartQty={handleUpdateCartQty}
          onClearCart={handleClearCart}
          preselectedService={selectedServiceForQuote}
          currentUser={currentUser}
        />
      </main>

      {/* Frictionless Direct Google Login + Unified Sign-In Modal */}
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

      {/* Pure Frosted Glass Shopping & Client Portal */}
      {currentUser && currentUser.role === 'client' && (
        <ClientPortalModal
          isOpen={clientPortalOpen}
          initialTab={clientPortalTab}
          onClose={() => setClientPortalOpen(false)}
          user={currentUser}
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateCartQty={handleUpdateCartQty}
          onClearCart={handleClearCart}
          services={cmsData.services}
          projects={cmsData.projects}
          allOrders={orders}
          onUserUpdated={setCurrentUser}
          primaryColor={cmsData.theme.primaryAccent}
          secondaryColor={cmsData.theme.secondaryAccent}
        />
      )}

      {/* Multi-Tier Master Owner & Sub-Admin CMS Panel */}
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
