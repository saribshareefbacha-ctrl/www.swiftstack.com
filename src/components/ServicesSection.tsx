import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Box,
  Check,
  Clock,
  Cloud,
  Code2,
  Cpu,
  Feather,
  Globe,
  Layers,
  Palette,
  Shield,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { CartItem, ServiceItem, ThemeCMS } from '../types/cms';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Code2,
  Box,
  Bot,
  Feather,
  Palette,
  Cloud,
  Sparkles,
  Globe,
  Cpu,
  Layers,
  Shield,
  Smartphone,
  Terminal,
  Zap,
};

interface ServicesSectionProps {
  services: ServiceItem[];
  cart: CartItem[];
  theme: ThemeCMS;
  onSelectService: (serviceTitle: string) => void;
  onAddToCart: (service: ServiceItem) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  cart,
  theme,
  onSelectService,
  onAddToCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(services.map((s) => s.category)));
    return ['All', ...unique];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'All') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const handleAddClick = (service: ServiceItem) => {
    onAddToCart(service);
    setJustAddedId(service.id);
    window.setTimeout(() => {
      setJustAddedId((prev) => (prev === service.id ? null : prev));
    }, 1000);
  };

  return (
    <section id="services" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading + Dynamic Category Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="ss-glass-card inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-cyan-300">
              <span>SwiftStack Digital Shopping &amp; Service Catalog</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              End-to-End Capabilities Built for{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                }}
              >
                Modern Brands
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Add digital services directly to your SwiftStack shopping cart or customize an
              enterprise milestone package in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active ? 'keep-white-text text-white shadow-md' : 'ss-glass-btn text-slate-300'
                  }`}
                  style={
                    active
                      ? {
                          backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                        }
                      : undefined
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pure Transparent Sheesha Service Cards Grid */}
        <div className="ss-responsive-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, idx) => {
            const IconComponent = ICON_MAP[service.iconName] || Sparkles;
            const accent = service.accentHex || theme.primaryColor;
            const cartItem = cart.find((c) => c.serviceId === service.id);
            const isAddedFlash = justAddedId === service.id;

            return (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (idx % 6) * 0.05 }}
                className="ss-glass-card ss-glass-interactive group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  {/* Top Row: Icon + Category + Featured Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${accent}25, rgba(255,255,255,0.06))`,
                      }}
                    >
                      <IconComponent className="w-6 h-6" style={{ color: accent }} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-slate-200 border border-white/15">
                        {service.category}
                      </span>
                      {service.featured && (
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                          style={{
                            color: accent,
                            borderColor: `${accent}55`,
                            backgroundColor: `${accent}16`,
                          }}
                        >
                          Popular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {service.shortDescription}
                    </p>
                  </div>

                  {/* Deliverables */}
                  {service.deliverables && service.deliverables.length > 0 && (
                    <ul className="space-y-2 pt-1">
                      {service.deliverables.map((item, dIdx) => (
                        <li
                          key={dIdx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200"
                        >
                          <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Pricing & Dual Actions (Add to Cart + Direct Quote) */}
                <div className="mt-7 pt-5 border-t border-white/15 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-base font-display font-bold text-white">
                        {service.priceLabel}
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs text-slate-300 mt-0.5">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{service.turnaround}</span>
                      </div>
                    </div>

                    {cartItem && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                        In Cart ×{cartItem.quantity}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleAddClick(service)}
                      className="keep-white-text ss-cta-btn inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md"
                      style={{
                        backgroundImage: isAddedFlash
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                      }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{isAddedFlash ? 'Added!' : 'Add to Cart'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectService(service.title)}
                      className="ss-glass-btn inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white"
                    >
                      <span>Custom Quote</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
