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
  isOwner: boolean;
  onManageProjects: () => void;
  onStartSimilarProject: (projectTitle: string) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  theme,
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
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Featured Portfolio &amp; Flagship Shipments</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
              Engineered by{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent}, ${theme.tertiaryAccent})`,
                }}
              >
                SwiftStack (SS)
              </span>
            </h2>
            <p className="text-slate-300/90 text-base sm:text-lg">
              Select case studies across spatial 3D WebGL commerce, cloud SaaS infrastructure,
              signed mobile APKs, and flagship AI content channels like @SoulSyllables.
            </p>
          </div>

          {isOwner && (
            <button
              onClick={onManageProjects}
              className="self-start lg:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <Edit3 className="w-3.5 h-3.5" />
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
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap border transition-all ${
                  active
                    ? 'text-slate-950 font-semibold border-transparent shadow-lg'
                    : 'text-slate-300 bg-slate-900/60 border-white/10 hover:bg-white/10'
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

        {/* Showcase Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filtered.map((project, idx) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: (idx % 2) * 0.1 }}
              onClick={() => setActiveProject(project)}
              style={{
                backgroundColor: `rgba(15, 23, 42, ${theme.glassOpacity})`,
              }}
              className="group cursor-pointer rounded-3xl border border-white/10 hover:border-cyan-400/50 backdrop-blur-xl overflow-hidden shadow-[0_20px_60px_rgba(2,6,23,0.75)] flex flex-col transition-all"
            >
              {/* Widescreen Visual Preview */}
              <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-950">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Floating Category & Year Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-950/85 text-cyan-300 border border-cyan-400/35 backdrop-blur-md">
                    {project.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-950/80 text-slate-300 border border-white/15">
                    {project.year}
                  </span>
                </div>

                {/* Key Metric Pill */}
                <div
                  className="absolute bottom-4 right-4 px-3.5 py-2 rounded-2xl backdrop-blur-xl border border-white/20 text-right shadow-lg"
                  style={{ backgroundColor: 'rgba(2, 6, 23, 0.86)' }}
                >
                  <div
                    className="font-display font-extrabold text-base sm:text-lg leading-none"
                    style={{ color: theme.primaryAccent }}
                  >
                    {project.metricValue}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-1">
                    {project.metricLabel}
                  </div>
                </div>
              </div>

              {/* Project Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <div className="text-xs font-mono text-cyan-300">{project.subtitle}</div>
                  <h3 className="font-display font-bold text-2xl text-white group-hover:text-cyan-200 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-300/90 leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white/[0.06] text-slate-300 border border-white/10"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span>Partner: {project.clientName}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-cyan-300 group-hover:translate-x-0.5 transition-transform">
                      <span>Inspect Case Study</span>
                      <ArrowUpRight className="w-4 h-4" />
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
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/15 shadow-2xl"
            >
              <div className="relative h-72 sm:h-80 bg-slate-950">
                <img
                  src={activeProject.imageUrl}
                  alt={activeProject.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setActiveProject(null)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-950/85 text-white border border-white/15 hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                      {activeProject.category} · {activeProject.clientName}
                    </div>
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                      {activeProject.title}
                    </h3>
                  </div>

                  <div className="px-4 py-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-400/35 text-right">
                    <div className="font-display font-extrabold text-xl text-cyan-300">
                      {activeProject.metricValue}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      {activeProject.metricLabel}
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                  {activeProject.description}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400 mr-1" />
                  {activeProject.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-mono bg-slate-950 text-cyan-200 border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Shipped {activeProject.year}</span>
                  </span>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveProject(null)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-white/15 hover:bg-white/5"
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-950 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                    }}
                  >
                    <span>Commission Similar Architecture</span>
                    <ExternalLink className="w-4 h-4" />
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
