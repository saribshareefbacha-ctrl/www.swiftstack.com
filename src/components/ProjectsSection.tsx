import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Calendar,
  Edit3,
  ExternalLink,
  Plus,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { ProjectItem, ThemeCMS } from '../types/cms';

interface ProjectsSectionProps {
  projects: ProjectItem[];
  theme: ThemeCMS;
  headingPrefix?: string;
  headingHighlight?: string;
  subheading?: string;
  isOwner: boolean;
  onManageProjects: () => void;
  onStartSimilarProject: (projectTitle: string) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  theme,
  headingPrefix = 'Engineered & Shipped by',
  headingHighlight = 'SwiftStack (SS)',
  subheading = 'Featured client builds across full-stack SaaS platforms, interactive web interfaces, signed mobile APKs, and flagship AI content ecosystems like @SoulSyllables.',
  isOwner,
  onManageProjects,
  onStartSimilarProject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.category)));
    return ['All', ...unique];
  }, [projects]);

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  return (
    <section id="projects" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-cyan-400">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Featured Portfolio &amp; Flagship Shipments</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
              {headingPrefix}{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent}, ${theme.tertiaryAccent})`,
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
              onClick={onManageProjects}
              className="ss-glass-btn self-start lg:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-cyan-400"
            >
              <Plus className="h-4 w-4" />
              <Edit3 className="h-3.5 w-3.5" />
              <span>Manage Projects ({projects.length})</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
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

        {/* Equal-Height Glass Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {filtered.map((project, idx) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: (idx % 2) * 0.08 }}
              onClick={() => setActiveProject(project)}
              className="ss-glass-card ss-glass-interactive group cursor-pointer rounded-3xl overflow-hidden flex h-full flex-col"
            >
              {/* Widescreen Visual Preview */}
              <div className="keep-dark-surface relative h-64 sm:h-72 overflow-hidden">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />

                {/* Floating Category & Year Badge */}
                <div className="keep-white-text absolute top-4 left-4 flex items-center gap-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-mono font-semibold backdrop-blur-md border border-cyan-400/45"
                    style={{ backgroundColor: 'rgba(6, 12, 26, 0.82)' }}
                  >
                    {project.category}
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-mono border border-white/20"
                    style={{ backgroundColor: 'rgba(6, 12, 26, 0.82)' }}
                  >
                    {project.year}
                  </span>
                </div>

                {/* Key Metric Pill */}
                <div
                  className="keep-white-text absolute bottom-4 right-4 px-3.5 py-2 rounded-2xl backdrop-blur-xl border border-white/20 text-right shadow-lg"
                  style={{ backgroundColor: 'rgba(6, 12, 26, 0.86)' }}
                >
                  <div className="font-display font-extrabold text-base sm:text-lg leading-none">
                    {project.metricValue}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-85 mt-1">
                    {project.metricLabel}
                  </div>
                </div>
              </div>

              {/* Project Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <div className="text-xs font-mono font-semibold text-cyan-400">
                    {project.subtitle}
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white group-hover:text-cyan-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((t, i) => (
                      <span
                        key={i}
                        className="ss-glass-card px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-400/25 flex items-center justify-between text-xs text-slate-400">
                    <span>Partner: {project.clientName}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Inspect Case Study</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Case Study Interactive Lightbox Modal */}
      <AnimatePresence>
        {activeProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveProject(null)}
            className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="ss-modal-surface w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            >
              <div className="keep-dark-surface relative h-72 sm:h-80">
                <img
                  src={activeProject.imageUrl}
                  alt={activeProject.title}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setActiveProject(null)}
                  className="keep-white-text absolute top-4 right-4 p-2.5 rounded-full border border-white/20"
                  style={{ backgroundColor: 'rgba(6, 12, 26, 0.85)' }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                      {activeProject.category} · {activeProject.clientName}
                    </div>
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                      {activeProject.title}
                    </h3>
                  </div>

                  <div className="ss-glass-card px-4 py-2.5 rounded-2xl text-right">
                    <div className="font-display font-extrabold text-xl text-cyan-400">
                      {activeProject.metricValue}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {activeProject.metricLabel}
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                  {activeProject.description}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="h-4 w-4 text-cyan-400 mr-1" />
                  {activeProject.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="ss-glass-card px-3 py-1 rounded-xl text-xs font-mono font-semibold text-cyan-400"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Shipped {activeProject.year}</span>
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-400/25 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveProject(null)}
                    className="ss-glass-btn px-5 py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Close Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const title = activeProject.title;
                      setActiveProject(null);
                      onStartSimilarProject(title);
                    }}
                    className="keep-white-text ss-cta-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                    }}
                  >
                    <span>Commission Similar Architecture</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
