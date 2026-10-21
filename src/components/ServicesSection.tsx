import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Boxes,
  Check,
  CheckCircle2,
  CloudCog,
  Code2,
  Cpu,
  Edit3,
  Layers,
  Megaphone,
  Plus,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Video,
} from 'lucide-react';
import { CartItem, ServiceItem, ThemeCMS } from '../types/cms';

interface ServicesSectionProps {
  services: ServiceItem[];
  theme: ThemeCMS;
  cart: CartItem[];
  headingPrefix?: string;
  headingHighlight?: string;
  subheading?: string;
  isOwner: boolean;
  onAddToCart: (service: ServiceItem) => void;
  onSelectServiceForQuote: (serviceTitle: string) => void;
  onManageServices: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Boxes,
  Code2,
  Smartphone,
  CloudCog,
  Sparkles,
  Video,
  Megaphone,
  Cpu,
  Layers,
};

const GlassServiceCard: React.FC<{
  service: ServiceItem;
  theme: ThemeCMS;
  index: number;
  inCartQty: number;
  onAddToCart: (srv: ServiceItem) => void;
  onSelect: (title: string) => void;
}> = ({ service, theme, index, inCartQty, onAddToCart, onSelect }) => {
  const [justAdded, setJustAdded] = useState(false);
  const IconComp = ICON_MAP[service.iconName] || Sparkles;

  const handleAdd = () => {
    onAddToCart(service);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.06 }}
      className="ss-glass-card ss-glass-interactive group flex h-full flex-col justify-between rounded-3xl p-6 sm:p-7"
    >
      <div className="space-y-4">
        {/* Top Row: Icon Badge + Category & Flagship Tag */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-400/25 shadow-sm transition-transform duration-300 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${service.accentHex}22, transparent)`,
              color: service.accentHex,
            }}
          >
            <IconComp className="h-6 w-6" />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {service.featured && (
              <span
                className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${theme.primaryAccent}1a`,
                  color: theme.primaryAccent,
                  border: `1px solid ${theme.primaryAccent}40`,
                }}
              >
                Flagship
              </span>
            )}
            <span className="ss-glass-card rounded-full px-2.5 py-1 font-mono text-[11px] font-medium text-slate-400">
              {service.category}
            </span>
          </div>
        </div>

        {/* Service Title & Description */}
        <div>
          <h3 className="font-display text-xl font-bold text-white transition-colors group-hover:text-cyan-400">
            {service.title}
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
            {service.shortDescription}
          </p>
        </div>

        {/* Deliverables */}
        {service.deliverables.length > 0 && (
          <ul className="space-y-1.5 pt-2">
            {service.deliverables.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: service.accentHex }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Pricing, Add to Cart & Quote Trigger */}
      <div className="mt-6 border-t border-slate-400/25 pt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg font-extrabold text-white">
            {service.priceLabel}
          </div>
          <div className="font-mono text-[11px] text-slate-400">Est. {service.turnaround}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="keep-white-text ss-cta-btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
            }}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added{inCartQty > 0 ? ` (${inCartQty})` : ''}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{inCartQty > 0 ? `In Cart (${inCartQty})` : 'Add to Cart'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelect(service.title)}
            className="ss-glass-btn inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold"
          >
            <span>Quote</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  theme,
  cart,
  headingPrefix = 'Full-Spectrum Services &',
  headingHighlight = 'Instant Shopping Portal',
  subheading = 'Add individual engineering or AI media packages straight to your glass shopping cart, or request a tailored multi-milestone architecture quote directly from Muhammad Sarib Randhawa.',
  isOwner,
  onAddToCart,
  onSelectServiceForQuote,
  onManageServices,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(services.map((s) => s.category)));
    return ['All', ...unique];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'All') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((item) => {
      map[item.serviceId] = item.quantity;
    });
    return map;
  }, [cart]);

  return (
    <section id="services" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-cyan-400">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: theme.primaryAccent }}
              />
              <span>SwiftStack (SS) Agency &amp; Service Storefront</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
              {headingPrefix}{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                }}
              >
                {headingHighlight}
              </span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">{subheading}</p>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={onManageServices}
              className="ss-glass-btn self-start lg:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-cyan-400"
            >
              <Plus className="h-4 w-4" />
              <Edit3 className="h-3.5 w-3.5" />
              <span>Manage Services ({services.length})</span>
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => {
            const active = cat === selectedCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  active ? 'keep-white-text ss-cta-btn shadow-md' : 'ss-glass-btn text-slate-300'
                }`}
                style={
                  active
                    ? {
                        background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                      }
                    : undefined
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Equal-Height Glass Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredServices.map((srv, idx) => (
            <GlassServiceCard
              key={srv.id}
              service={srv}
              theme={theme}
              index={idx}
              inCartQty={cartQtyMap[srv.id] || 0}
              onAddToCart={onAddToCart}
              onSelect={onSelectServiceForQuote}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
