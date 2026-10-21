import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CloudCog,
  Code2,
  Cpu,
  Edit3,
  Layers,
  Megaphone,
  Plus,
  Smartphone,
  Sparkles,
  Video,
} from 'lucide-react';
import { ServiceItem, ThemeCMS } from '../types/cms';

interface ServicesSectionProps {
  services: ServiceItem[];
  theme: ThemeCMS;
  headingPrefix?: string;
  headingHighlight?: string;
  subheading?: string;
  isOwner: boolean;
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

const Interactive3DServiceCard: React.FC<{
  service: ServiceItem;
  theme: ThemeCMS;
  index: number;
  onSelect: (title: string) => void;
}> = ({ service, theme, index, onSelect }) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const IconComp = ICON_MAP[service.iconName] || Sparkles;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 10,
      ry: (px - 0.5) * 10,
      gx: px * 100,
      gy: py * 100,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1100px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: 'preserve-3d',
        backgroundColor: `rgba(15, 23, 42, ${theme.glassOpacity})`,
      }}
      className="group relative rounded-3xl border border-white/10 hover:border-cyan-400/45 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-[0_14px_40px_rgba(2,6,23,0.6)] overflow-hidden"
    >
      {/* Dynamic Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 240px at ${tilt.gx}% ${tilt.gy}%, ${service.accentHex}24, transparent 80%)`,
        }}
      />

      <div className="relative z-10 space-y-4">
        {/* Top Row: 3D Floating Icon Cube + Category & Featured Tag */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/15 shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${service.accentHex}30, rgba(15,23,42,0.9))`,
              color: service.accentHex,
            }}
          >
            <IconComp className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-2">
            {service.featured && (
              <span
                className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold"
                style={{
                  backgroundColor: `${theme.primaryAccent}20`,
                  color: theme.primaryAccent,
                  border: `1px solid ${theme.primaryAccent}45`,
                }}
              >
                Flagship
              </span>
            )}
            <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              {service.category}
            </span>
          </div>
        </div>

        {/* Service Title & Description */}
        <div>
          <h3 className="font-display font-bold text-xl text-white group-hover:text-cyan-200 transition-colors">
            {service.title}
          </h3>
          <p className="mt-2.5 text-sm text-slate-300/90 leading-relaxed">
            {service.shortDescription}
          </p>
        </div>

        {/* Key Deliverables List */}
        {service.deliverables.length > 0 && (
          <ul className="space-y-1.5 pt-2">
            {service.deliverables.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: service.accentHex }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Pricing, Turnaround & Quote Trigger */}
      <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="font-display font-bold text-base text-white">
            {service.priceLabel}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Est. {service.turnaround}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(service.title)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/[0.08] hover:bg-cyan-500 hover:text-slate-950 border border-white/15 hover:border-cyan-300 transition-all"
        >
          <span>Request Quote</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  theme,
  headingPrefix = 'Full-Spectrum Engineering,',
  headingHighlight = 'Cloud Architecture & AI Media',
  subheading = 'Every engagement combines precision software engineering with clean visual direction — architected end-to-end under Muhammad Sarib Randhawa.',
  isOwner,
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

  return (
    <section id="services" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-300">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.primaryAccent }}
              />
              <span>SwiftStack (SS) Capabilities Matrix</span>
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
            <p className="text-slate-300/90 text-base sm:text-lg">
              {subheading}
            </p>
          </div>

          {isOwner && (
            <button
              onClick={onManageServices}
              className="self-start lg:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manage Services Catalog ({services.length})</span>
            </button>
          )}
        </div>

        {/* Interactive Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => {
            const active = cat === selectedCategory;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all border ${
                  active
                    ? 'text-slate-950 font-semibold shadow-lg border-transparent'
                    : 'text-slate-300 bg-slate-900/60 border-white/10 hover:bg-white/10 hover:text-white'
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

        {/* 3D Interactive Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((srv, idx) => (
            <Interactive3DServiceCard
              key={srv.id}
              service={srv}
              theme={theme}
              index={idx}
              onSelect={onSelectServiceForQuote}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
