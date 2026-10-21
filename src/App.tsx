import React, { useCallback, useEffect, useState } from 'react';
import { Crown, Monitor, ShieldCheck, ShoppingCart, Smartphone } from 'lucide-react';
import { DEFAULT_CMS_DATA, INITIAL_SAMPLE_INQUIRIES } from './data/defaultSeed';
import {
  CartItem,
  InquiryItem,
  ServiceItem,
  SiteCMSData,
  ThemeMode,
  UserProfile,
  ViewLayoutMode,
  VoiceEngineConfig,
} from './types/cms';
import {
  api,
  CloudSyncState,
  getSavedCart,
  getSavedThemeMode,
  saveCart,
  saveThemeMode,
  subscribeSyncState,
} from './utils/api';
import {
  applyViewModeToDocument,
  detectNaturalDeviceMode,
  getSavedViewMode,
  hasSavedViewMode,
  saveViewMode,
} from './utils/viewMode';
import { FuturisticRobotCanvas } from './components/FuturisticRobotCanvas';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ContactQuoteSection } from './components/ContactQuoteSection';
import { AuthModal } from './components/AuthModal';
import { ClientPortalModal } from './components/ClientPortalModal';
import { AdminCustomizationPanel } from './components/AdminCustomizationPanel';
import { SwiftStackLogo } from './components/SwiftStackLogo';
import { ViewModeSelectorModal } from './components/ViewModeSelectorModal';
import { GlassToastViewport, pushToast } from './components/GlassUI';
import { syncDocumentBranding } from './utils/branding';

export function App() {
  const [cmsData, setCmsData] = useState<SiteCMSData>(() => structuredClone(DEFAULT_CMS_DATA));
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() =>
    structuredClone(INITIAL_SAMPLE_INQUIRIES)
  );
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => getSavedThemeMode() || DEFAULT_CMS_DATA.theme.defaultMode || 'glass'
  );
  const [viewMode, setViewMode] = useState<ViewLayoutMode>(
    () => getSavedViewMode() || detectNaturalDeviceMode()
  );
  const [showViewModePrompt, setShowViewModePrompt] = useState<boolean>(
    () => !hasSavedViewMode()
  );
  const [cart, setCart] = useState<CartItem[]>(() => getSavedCart());
  const [, setSyncState] = useState<CloudSyncState>('connecting');

  // Interactive Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [portalOpen, setPortalOpen] = useState(false);
  const [portalInitialTab, setPortalInitialTab] = useState<'cart' | 'orders' | 'new' | 'profile'>(
    'cart'
  );
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<string>(
    DEFAULT_CMS_DATA.services[0]?.title || ''
  );

  // Real-time Firebase Subscriptions (CMS + Orders + Persistent Auth + Dual-Gmail Owner Auto-Unlock)
  useEffect(() => {
    const unsubSync = subscribeSyncState(setSyncState);
    const unsubCMS = api.subscribeCMS((liveCMS) => {
      setCmsData(liveCMS);
      if (!getSavedThemeMode() && liveCMS.theme?.defaultMode) {
        setThemeMode(liveCMS.theme.defaultMode);
        document.documentElement.setAttribute('data-theme', liveCMS.theme.defaultMode);
      }
    });
    const unsubOrders = api.subscribeOrders((liveOrders) => {
      setInquiries(liveOrders);
    });
    const unsubAuth = api.subscribeAuth((user, fromOAuthRedirect) => {
      setCurrentUser(user);
      if (fromOAuthRedirect && user && (user.role === 'owner' || user.role === 'subadmin')) {
        setAdminPanelOpen(true);
        pushToast(
          'Master Owner Recognized via Google',
          `Welcome ${user.displayName} (${user.email}). Owner Admin Dashboard unlocked!`,
          'success'
        );
      }
    });

    return () => {
      unsubSync();
      unsubCMS();
      unsubOrders();
      unsubAuth();
    };
  }, []);

  // Apply Active Sheesha Glass / Crystal / Obsidian / Cyber Theme Mode & Live Branding Meta
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    syncDocumentBranding(cmsData.branding, cmsData.theme);
  }, [themeMode, cmsData.branding, cmsData.theme]);

  // Apply Dynamic Desktop / Mobile Viewport & Layout Orientation
  useEffect(() => {
    applyViewModeToDocument(viewMode);
  }, [viewMode]);

  const handleSelectViewMode = (mode: ViewLayoutMode) => {
    setViewMode(mode);
    saveViewMode(mode);
    setShowViewModePrompt(false);
    pushToast(
      mode === 'desktop' ? 'Desktop View Activated' : 'Mobile View Activated',
      'Preference saved! You can switch views anytime from the top header.',
      'success'
    );
  };

  const handleChangeThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemeMode(mode);
    const names: Record<ThemeMode, string> = {
      glass: 'Pure Sheesha Glass',
      light: 'Crystal Light',
      dark: 'Obsidian Dark',
      cyber: 'Cyber Neon',
    };
    pushToast(`Theme: ${names[mode]}`, 'Visual refraction & contrast updated live.', 'info');
  };

  // Shopping Cart Operations with Pure Sheesha Toast Notifications
  const handleAddToCart = (service: ServiceItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.serviceId === service.id);
      const next = existing
        ? prev.map((i) => (i.serviceId === service.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [
            ...prev,
            {
              serviceId: service.id,
              title: service.title,
              category: service.category,
              priceLabel: service.priceLabel,
              basePriceUsd: service.basePriceUsd,
              quantity: 1,
            },
          ];
      saveCart(next);
      return next;
    });
    pushToast('Added to Shopping Cart', `${service.title} (${service.priceLabel})`, 'success');
  };

  const handleUpdateCartQty = (serviceId: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((item) =>
          item.serviceId === serviceId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0);
      saveCart(next);
      return next;
    });
  };

  const handleRemoveCartItem = (serviceId: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.serviceId !== serviceId);
      saveCart(next);
      return next;
    });
    pushToast('Item Removed', 'Updated your SwiftStack shopping cart.', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
    saveCart([]);
  };

  const handleVoiceQuickChange = (patch: Partial<VoiceEngineConfig>) => {
    setCmsData((prev) => {
      const updatedVoice = { ...prev.voice, ...patch };
      if (currentUser?.role === 'owner' || currentUser?.role === 'subadmin') {
        api.updateVoice(updatedVoice).catch(() => {});
      }
      return { ...prev, voice: updatedVoice };
    });
  };

  const refreshCMS = useCallback(async () => {
    // Real-time Firestore listener updates state automatically
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectServiceForOrder = (serviceTitle: string) => {
    setPreselectedService(serviceTitle);
    scrollToSection('order');
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setAdminPanelOpen(false);
    setPortalOpen(false);
    pushToast('Signed Out', 'Your SwiftStack session has been closed safely.', 'info');
  };

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const isStaff = currentUser?.role === 'owner' || currentUser?.role === 'subadmin';
  const nextViewMode: ViewLayoutMode = viewMode === 'desktop' ? 'mobile' : 'desktop';

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-cyan-400 selection:text-slate-950">
      {/* Futuristic Interactive Robot & Human-Robot Finger Touch Energy Ripple Canvas */}
      <FuturisticRobotCanvas
        themeMode={themeMode}
        primaryHex={cmsData.theme.primaryColor}
        secondaryHex={cmsData.theme.secondaryColor}
        accentHex={cmsData.theme.accentColor}
      />

      {/* Global Pure-Sheesha Glassmorphic Toast Notification Viewport */}
      <GlassToastViewport />

      {/* First-Visit Preferred View / Orientation Selector Modal */}
      <ViewModeSelectorModal
        isOpen={showViewModePrompt}
        recommendedMode={detectNaturalDeviceMode()}
        primaryColor={cmsData.theme.primaryColor}
        secondaryColor={cmsData.theme.secondaryColor}
        companyName={cmsData.branding.companyName}
        monogram={cmsData.branding.monogram}
        profileIconUrl={cmsData.branding.profileIconUrl}
        onSelectMode={handleSelectViewMode}
      />

      {/* Top Pure Transparent Sheesha Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        primaryColor={cmsData.theme.primaryColor}
        secondaryColor={cmsData.theme.secondaryColor}
        companyName={cmsData.branding.companyName}
        monogram={cmsData.branding.monogram}
        profileIconUrl={cmsData.branding.profileIconUrl}
        themeMode={themeMode}
        viewMode={viewMode}
        cartCount={totalCartItems}
        onChangeThemeMode={handleChangeThemeMode}
        onToggleViewMode={handleSelectViewMode}
        onOpenAuth={(tab = 'login') => {
          setAuthInitialTab(tab);
          setAuthModalOpen(true);
        }}
        onOpenAdminPanel={() => setAdminPanelOpen(true)}
        onOpenClientPortal={() => {
          setPortalInitialTab('orders');
          setPortalOpen(true);
        }}
        onOpenCart={() => {
          setPortalInitialTab('cart');
          setPortalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Dynamic Desktop / Mobile Responsive Shell */}
      <div className="ss-viewport-shell relative z-10">
        <main>
          <HeroSection
            hero={cmsData.hero}
            theme={cmsData.theme}
            voice={cmsData.voice}
            onVoiceQuickChange={handleVoiceQuickChange}
            onExploreServices={() => scrollToSection('services')}
            onStartOrder={() => scrollToSection('order')}
          />

          <ServicesSection
            services={cmsData.services}
            cart={cart}
            theme={cmsData.theme}
            onSelectService={handleSelectServiceForOrder}
            onAddToCart={handleAddToCart}
          />

          <ProjectsSection
            projects={cmsData.projects}
            theme={cmsData.theme}
            onStartSimilarProject={handleSelectServiceForOrder}
          />

          <ContactQuoteSection
            services={cmsData.services}
            branding={cmsData.branding}
            theme={cmsData.theme}
            currentUser={currentUser}
            cart={cart}
            preselectedService={preselectedService}
            onInquiryCreated={refreshCMS}
            onClearCart={handleClearCart}
            onOpenAuth={(tab = 'login') => {
              setAuthInitialTab(tab);
              setAuthModalOpen(true);
            }}
            onOpenClientPortal={() => {
              setPortalInitialTab('orders');
              setPortalOpen(true);
            }}
            onOpenCart={() => {
              setPortalInitialTab('cart');
              setPortalOpen(true);
            }}
          />
        </main>

        {/* Pure Transparent Sheesha Footer */}
        <footer className="relative z-10 border-t border-white/15 py-12 backdrop-blur-2xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="ss-responsive-grid grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/15">
              <div className="ss-hero-col md:col-span-5 space-y-3">
                <SwiftStackLogo
                  primaryColor={cmsData.theme.primaryColor}
                  secondaryColor={cmsData.theme.secondaryColor}
                  companyName={cmsData.branding.companyName}
                  monogram={cmsData.branding.monogram}
                  profileIconUrl={cmsData.branding.profileIconUrl}
                />
                <p className="text-sm text-slate-300 max-w-md leading-relaxed">
                  {cmsData.branding.footerTagline}
                </p>
                <p className="text-xs font-mono text-cyan-400">
                  Founded &amp; Owned by {cmsData.branding.founderName}
                </p>
              </div>

              <div className="ss-hero-col md:col-span-3 space-y-2.5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                  Navigation
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>
                    <a href="#hero" className="hover:text-cyan-400 transition-colors">
                      Dynamic Voice Intro
                    </a>
                  </li>
                  <li>
                    <a href="#services" className="hover:text-cyan-400 transition-colors">
                      Services &amp; Shopping
                    </a>
                  </li>
                  <li>
                    <a href="#projects" className="hover:text-cyan-400 transition-colors">
                      Portfolio Showcase
                    </a>
                  </li>
                  <li>
                    <a href="#order" className="hover:text-cyan-400 transition-colors">
                      Request Custom Quote
                    </a>
                  </li>
                </ul>
              </div>

              <div className="ss-hero-col md:col-span-4 space-y-2.5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                  Portal &amp; View Controls
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Switch between Desktop View and Mobile View, track orders, or sign in with Google.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSelectViewMode(nextViewMode)}
                    className="ss-glass-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-300"
                  >
                    {viewMode === 'desktop' ? (
                      <>
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Switch to Mobile View</span>
                      </>
                    ) : (
                      <>
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Switch to Desktop View</span>
                      </>
                    )}
                  </button>

                  {isStaff ? (
                    <button
                      type="button"
                      onClick={() => setAdminPanelOpen(true)}
                      className="keep-white-text px-4 py-2 rounded-xl text-xs font-bold text-white shadow"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                      }}
                    >
                      {currentUser?.role === 'owner' ? 'Owner Dashboard' : 'Sub-Admin Portal'}
                    </button>
                  ) : currentUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPortalInitialTab('orders');
                        setPortalOpen(true);
                      }}
                      className="ss-glass-btn px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    >
                      Open My Client Portal
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthInitialTab('login');
                        setAuthModalOpen(true);
                      }}
                      className="ss-glass-btn px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    >
                      Login / Sign Up
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <span>{cmsData.branding.copyrightText}</span>
              <span>SwiftStack (SS) · Pure Sheesha Glass Edition</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Bottom-Right Shopping Cart Pill */}
      {totalCartItems > 0 && !portalOpen && (
        <button
          type="button"
          onClick={() => {
            setPortalInitialTab('cart');
            setPortalOpen(true);
          }}
          className="keep-white-text ss-cta-btn fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold text-white shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
          }}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Checkout Cart ({totalCartItems})</span>
        </button>
      )}

      {/* Floating Bottom-Left Owner / Sub-Admin Quick Dashboard Pill */}
      {isStaff && !adminPanelOpen && (
        <button
          type="button"
          onClick={() => setAdminPanelOpen(true)}
          className="keep-white-text ss-cta-btn fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold text-white shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
          }}
        >
          {currentUser?.role === 'owner' ? (
            <Crown className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>{currentUser?.role === 'owner' ? 'Owner Dashboard' : 'Sub-Admin Portal'}</span>
        </button>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authInitialTab}
        primaryColor={cmsData.theme.primaryColor}
        secondaryColor={cmsData.theme.secondaryColor}
        companyName={cmsData.branding.companyName}
        monogram={cmsData.branding.monogram}
        profileIconUrl={cmsData.branding.profileIconUrl}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(user, openDashboardIfStaff) => {
          setCurrentUser(user);
          if (openDashboardIfStaff && (user.role === 'owner' || user.role === 'subadmin')) {
            setAdminPanelOpen(true);
          }
        }}
      />

      {/* Shopping Cart & Client Portal Modal */}
      <ClientPortalModal
        isOpen={portalOpen}
        initialTab={portalInitialTab}
        user={currentUser}
        services={cmsData.services}
        inquiries={inquiries}
        cart={cart}
        theme={cmsData.theme}
        onClose={() => setPortalOpen(false)}
        onOpenAuth={(tab = 'login') => {
          setAuthInitialTab(tab);
          setAuthModalOpen(true);
        }}
        onUpdateCartQty={handleUpdateCartQty}
        onRemoveCartItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onAddServiceToCart={handleAddToCart}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* Owner & Scoped Sub-Admin CMS Panel */}
      {isStaff && currentUser && (
        <AdminCustomizationPanel
          isOpen={adminPanelOpen}
          currentUser={currentUser}
          cmsData={cmsData}
          inquiries={inquiries}
          onClose={() => setAdminPanelOpen(false)}
          onRefreshCMS={refreshCMS}
        />
      )}
    </div>
  );
}
export default App;
