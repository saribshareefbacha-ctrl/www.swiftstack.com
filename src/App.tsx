import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Crown, Lock, ShieldCheck, ShoppingCart } from 'lucide-react';
import { DEFAULT_CMS_DATA, INITIAL_SAMPLE_INQUIRIES } from './data/defaultSeed';
import {
  AppPageView,
  CartItem,
  InquiryItem,
  ServiceItem,
  SiteCMSData,
  ThemeMode,
  UserProfile,
  ViewLayoutMode,
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
import {
  readInitialNavState,
  saveNavState,
  updateUrlHashSilently,
} from './utils/navigationState';
import { FuturisticRobotCanvas } from './components/FuturisticRobotCanvas';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ContactQuoteSection } from './components/ContactQuoteSection';
import { AuthModal } from './components/AuthModal';
import { ClientPortalModal } from './components/ClientPortalModal';
import { AdminCustomizationPanel, AdminTab } from './components/AdminCustomizationPanel';
import { ViewModeSelectorModal } from './components/ViewModeSelectorModal';
import { GlassFooter } from './components/GlassFooter';
import { GlassToastViewport, pushToast } from './components/GlassUI';
import { syncDocumentBranding } from './utils/branding';

export function App() {
  const initialNavRef = useRef(readInitialNavState());

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

  // Active Route & Section State Preserved Across Reloads (URL Hash + LocalStorage)
  const [activePage, setActivePage] = useState<AppPageView>(() => initialNavRef.current.page);
  const [adminTab, setAdminTab] = useState<string>(() => initialNavRef.current.adminTab || 'voice');

  // Interactive Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [portalOpen, setPortalOpen] = useState<boolean>(() =>
    Boolean(initialNavRef.current.portalOpen)
  );
  const [portalInitialTab, setPortalInitialTab] = useState<'cart' | 'orders' | 'new' | 'profile'>(
    () => initialNavRef.current.portalTab || 'cart'
  );
  const [preselectedService, setPreselectedService] = useState<string>(
    DEFAULT_CMS_DATA.services[0]?.title || ''
  );

  // Open Dedicated Full-Page Owner / Sub-Admin Dashboard Route (100% Zero Blank Screen!)
  const navigateToOwnerDashboard = useCallback(
    (targetTab?: string) => {
      const nextTab = targetTab || adminTab || 'voice';
      setAdminTab(nextTab);
      setActivePage('owner-dashboard');
      setPortalOpen(false);
      setAuthModalOpen(false);
      saveNavState({ page: 'owner-dashboard', adminTab: nextTab, portalOpen: false });
      updateUrlHashSilently(`#/owner-dashboard/${nextTab}`);
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    [adminTab]
  );

  const navigateBackToStorefront = useCallback((sectionId = 'hero') => {
    setActivePage('home');
    saveNavState({ page: 'home', sectionId, portalOpen: false });
    updateUrlHashSilently(`#${sectionId}`);
    requestAnimationFrame(() => {
      if (sectionId === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, []);

  // Real-time Firebase Subscriptions (CMS + Orders + Persistent Auth + Dual-Gmail Owner Auto-Redirect)
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
        setActivePage('owner-dashboard');
        saveNavState({ page: 'owner-dashboard', adminTab: 'voice', portalOpen: false });
        updateUrlHashSilently('#/owner-dashboard/voice');
        window.scrollTo({ top: 0, behavior: 'auto' });
        pushToast(
          'Master Owner Recognized via Google',
          `Welcome ${user.displayName} (${user.email}). Redirected to Owner Dashboard!`,
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

  // Restore Exact Scroll Position / Section on Reload + Listen to Browser Hash Changes
  useEffect(() => {
    const init = initialNavRef.current;
    if (init.page === 'home') {
      const timer = window.setTimeout(() => {
        if (init.scrollY && init.scrollY > 80) {
          window.scrollTo({ top: init.scrollY, behavior: 'auto' });
        } else if (init.sectionId && init.sectionId !== 'hero') {
          document.getElementById(init.sectionId)?.scrollIntoView({ behavior: 'auto' });
        }
      }, 90);
      return () => window.clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  // Passive Scroll Position & Active Section Persistence + Hash Navigation Listener
  useEffect(() => {
    let scrollDebounce: number | null = null;

    const handleScroll = () => {
      if (activePage !== 'home') return;
      if (scrollDebounce !== null) window.clearTimeout(scrollDebounce);
      scrollDebounce = window.setTimeout(() => {
        const y = window.scrollY || 0;
        const sections = ['order', 'projects', 'services', 'hero'];
        let currentSec = 'hero';
        for (const id of sections) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 240) {
            currentSec = id;
            break;
          }
        }
        saveNavState({ page: 'home', sectionId: currentSec, scrollY: y });
        if (!portalOpen) {
          updateUrlHashSilently(`#${currentSec}`);
        }
      }, 180);
    };

    const handleHashChange = () => {
      const h = window.location.hash.trim();
      if (h.startsWith('#/owner-dashboard')) {
        const parts = h.replace('#/owner-dashboard', '').split('/').filter(Boolean);
        setActivePage('owner-dashboard');
        if (parts[0]) setAdminTab(parts[0]);
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else if (h === '#/cart' || h === '#/portal') {
        setActivePage('home');
        setPortalInitialTab(h === '#/cart' ? 'cart' : 'orders');
        setPortalOpen(true);
      } else if (/^#(hero|services|projects|order|footer)$/.test(h)) {
        const targetId = h.slice(1);
        setActivePage('home');
        setPortalOpen(false);
        saveNavState({ page: 'home', sectionId: targetId });
        requestAnimationFrame(() => {
          document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleHashChange, { passive: true });

    return () => {
      if (scrollDebounce !== null) window.clearTimeout(scrollDebounce);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [activePage, portalOpen]);

  // Apply Active Sheesha Glass Theme & Dynamic Branding Meta
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    syncDocumentBranding(cmsData.branding, cmsData.theme);
  }, [themeMode, cmsData.branding, cmsData.theme]);

  // Apply Pixel-Perfect Desktop / Mobile Viewport Scaling (and re-sync on device rotation)
  useEffect(() => {
    applyViewModeToDocument(viewMode);
    const onOrientationOrResize = () => applyViewModeToDocument(viewMode);
    window.addEventListener('orientationchange', onOrientationOrResize, { passive: true });
    return () => {
      window.removeEventListener('orientationchange', onOrientationOrResize);
    };
  }, [viewMode]);

  const handleSelectViewMode = (mode: ViewLayoutMode) => {
    setViewMode(mode);
    saveViewMode(mode);
    setShowViewModePrompt(false);
    pushToast(
      mode === 'desktop' ? 'Desktop View Active' : 'Mobile View Active',
      'Preference saved! Switch views anytime from the top header.',
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

  // Shopping Cart Operations
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

  const refreshCMS = useCallback(async () => {
    // Real-time Firestore snapshot listener keeps state live automatically
  }, []);

  const scrollToSection = (id: string) => {
    if (activePage !== 'home') {
      navigateBackToStorefront(id);
      return;
    }
    saveNavState({ page: 'home', sectionId: id });
    updateUrlHashSilently(`#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectServiceForOrder = (serviceTitle: string) => {
    setPreselectedService(serviceTitle);
    scrollToSection('order');
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setActivePage('home');
    setPortalOpen(false);
    saveNavState({ page: 'home', sectionId: 'hero', scrollY: 0, portalOpen: false });
    updateUrlHashSilently('#hero');
    pushToast('Signed Out', 'Your SwiftStack session has been closed safely.', 'info');
  };

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const isStaff = currentUser?.role === 'owner' || currentUser?.role === 'subadmin';

  return (
    <div className="relative min-h-screen w-full selection:bg-cyan-400 selection:text-slate-950">
      {/* Dedicated GPU-Composited Atmospheric Layer (Zero scroll repaint!) */}
      <div className="ss-gpu-backdrop" aria-hidden="true" />

      {/* Photorealistic Human & Robotic Hand Touch + Digital Shockwave Canvas (Paused in Admin Dashboard for 0% CPU!) */}
      <FuturisticRobotCanvas
        themeMode={themeMode}
        primaryHex={cmsData.theme.primaryColor}
        secondaryHex={cmsData.theme.secondaryColor}
        accentHex={cmsData.theme.accentColor}
        paused={activePage === 'owner-dashboard'}
      />

      {/* Global Pure-Sheesha Glassmorphic Toast Notification Viewport */}
      <GlassToastViewport />

      {/* First-Visit Preferred View / Mode Selector Modal */}
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
        onNavigateSection={scrollToSection}
        onChangeThemeMode={handleChangeThemeMode}
        onToggleViewMode={handleSelectViewMode}
        onOpenAuth={(tab = 'login') => {
          setAuthInitialTab(tab);
          setAuthModalOpen(true);
        }}
        onOpenAdminPanel={() => navigateToOwnerDashboard()}
        onOpenClientPortal={() => {
          setPortalInitialTab('orders');
          setPortalOpen(true);
          saveNavState({ portalOpen: true, portalTab: 'orders' });
          updateUrlHashSilently('#/portal');
        }}
        onOpenCart={() => {
          setPortalInitialTab('cart');
          setPortalOpen(true);
          saveNavState({ portalOpen: true, portalTab: 'cart' });
          updateUrlHashSilently('#/cart');
        }}
        onLogout={handleLogout}
      />

      {/* Main Dynamic Viewport Shell */}
      <div className="ss-viewport-shell relative z-10">
        {activePage === 'owner-dashboard' ? (
          isStaff && currentUser ? (
            <AdminCustomizationPanel
              currentUser={currentUser}
              cmsData={cmsData}
              inquiries={inquiries}
              initialTab={adminTab}
              onTabChange={(nextTab: AdminTab) => {
                setAdminTab(nextTab);
                saveNavState({ page: 'owner-dashboard', adminTab: nextTab });
                updateUrlHashSilently(`#/owner-dashboard/${nextTab}`);
              }}
              onBackToSite={() => navigateBackToStorefront('hero')}
              onRefreshCMS={refreshCMS}
            />
          ) : (
            /* Clean Auth Gate Card if user refreshes #/owner-dashboard without an active Owner session (NEVER blank!) */
            <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
              <div className="ss-admin-card max-w-md w-full rounded-3xl p-7 text-center space-y-5">
                <div
                  className="keep-white-text mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                  }}
                >
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-display text-2xl font-extrabold text-white">
                    Owner Authorization Required
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Sign in with Google using your authorized Owner Gmail to open the full
                    SwiftStack Master Owner Dashboard immediately.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthInitialTab('login');
                      setAuthModalOpen(true);
                    }}
                    className="keep-white-text ss-cta-btn flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                    }}
                  >
                    Sign In as Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateBackToStorefront('hero')}
                    className="ss-glass-btn py-3 px-4 rounded-xl text-xs font-semibold text-white"
                  >
                    Back to Storefront
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          <>
            <main>
              <HeroSection
                hero={cmsData.hero}
                metrics={cmsData.metrics}
                liveProjectsCount={cmsData.projects.length}
                liveOrdersCount={inquiries.length}
                theme={cmsData.theme}
                voice={cmsData.voice}
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
                  saveNavState({ portalOpen: true, portalTab: 'orders' });
                  updateUrlHashSilently('#/portal');
                }}
                onOpenCart={() => {
                  setPortalInitialTab('cart');
                  setPortalOpen(true);
                  saveNavState({ portalOpen: true, portalTab: 'cart' });
                  updateUrlHashSilently('#/cart');
                }}
              />
            </main>

            <GlassFooter
              branding={cmsData.branding}
              socialLinks={cmsData.socialLinks}
              theme={cmsData.theme}
              viewMode={viewMode}
              currentUser={currentUser}
              onToggleViewMode={handleSelectViewMode}
              onOpenAdminPanel={() => navigateToOwnerDashboard()}
              onOpenClientPortal={() => {
                setPortalInitialTab('orders');
                setPortalOpen(true);
                saveNavState({ portalOpen: true, portalTab: 'orders' });
                updateUrlHashSilently('#/portal');
              }}
              onOpenAuth={(tab = 'login') => {
                setAuthInitialTab(tab);
                setAuthModalOpen(true);
              }}
            />
          </>
        )}
      </div>

      {/* Floating Bottom-Right Shopping Cart Pill */}
      {activePage === 'home' && totalCartItems > 0 && !portalOpen && (
        <button
          type="button"
          onClick={() => {
            setPortalInitialTab('cart');
            setPortalOpen(true);
            saveNavState({ portalOpen: true, portalTab: 'cart' });
            updateUrlHashSilently('#/cart');
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
      {activePage === 'home' && isStaff && (
        <button
          type="button"
          onClick={() => navigateToOwnerDashboard()}
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
          <span>
            {currentUser?.role === 'owner' ? 'Open Owner Dashboard' : 'Open Sub-Admin Portal'}
          </span>
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
            navigateToOwnerDashboard('voice');
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
        onClose={() => {
          setPortalOpen(false);
          saveNavState({ portalOpen: false });
          if (activePage === 'home') {
            updateUrlHashSilently('#hero');
          }
        }}
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
    </div>
  );
}
export default App;
