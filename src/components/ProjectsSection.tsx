import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Award, Calendar, ExternalLink, Layers, X } from 'lucide-react';
import { ProjectItem, ThemeCMS } from '../types/cms';

interface ProjectsSectionProps {
  projects: ProjectItem[];
  theme: ThemeCMS;
  onStartSimilarProject: (projectTitle: string) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  theme,
  onStartSimilarProject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.category)));
    return ['All', ...unique];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  return (
    <section id="projects" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Heading + Category Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="ss-glass-card inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-indigo-300">
              <Layers className="w-3.5 h-3.5" />
              <span>Selected Portfolio &amp; Live Case Studies</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Recent Work Crafted by{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                }}
              >
                SwiftStack
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Explore live digital platforms, AI automation workflows, and creative brand worlds
              delivered for founders and creators.
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
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
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

        {/* Pure Sheesha Portfolio Cards */}
        <div className="ss-responsive-grid grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProjects.map((project, idx) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (idx % 4) * 0.07 }}
              className="ss-glass-card ss-glass-interactive group rounded-3xl overflow-hidden flex flex-col"
            >
              <div
                onClick={() => setActiveProject(project)}
                className="relative h-60 sm:h-72 overflow-hidden cursor-pointer bg-slate-900"
              >
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

                <div className="keep-white-text keep-dark-surface absolute top-4 left-4 right-4 flex items-center justify-between gap-2 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <span className="text-xs font-mono text-cyan-300">{project.category}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-white">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    {project.metricLabel}: {project.metricValue}
                  </span>
                </div>

                <div className="keep-white-text absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-cyan-300">{project.subtitle}</p>
                    <h3 className="font-display text-2xl font-bold text-white mt-0.5">
                      {project.title}
                    </h3>
                  </div>
                  <span className="keep-white-text keep-dark-surface p-2.5 rounded-xl border border-white/25 text-white group-hover:border-cyan-400 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                <p className="text-sm text-slate-300 leading-relaxed">{project.description}</p>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/15 flex items-center justify-between gap-3 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      Client: <strong className="text-white">{project.clientName}</strong> (
                      {project.year})
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveProject(project)}
                        className="font-semibold text-cyan-400 hover:underline"
                      >
                        Case Study
                      </button>

                      {project.liveUrl && project.liveUrl.startsWith('http') && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-white hover:text-cyan-400"
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Case Study Detail Pure-Sheesha Modal */}
      {activeProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={activeProject.title}
        >
          <div className="ss-modal-surface relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="relative h-64 bg-slate-900 shrink-0">
              <img
                src={activeProject.imageUrl}
                alt={activeProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                aria-label="Close modal"
                className="keep-white-text keep-dark-surface absolute top-4 right-4 p-2 rounded-xl border border-white/25 text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="keep-white-text absolute bottom-4 left-6 right-6">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
                  {activeProject.category} · {activeProject.year}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {activeProject.title}
                </h3>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/5 border border-white/15 p-4">
                <div>
                  <div className="text-xs text-slate-400">Partner / Client</div>
                  <div className="text-sm font-bold text-white">{activeProject.clientName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">{activeProject.metricLabel}</div>
                  <div className="text-sm font-bold text-cyan-400">
                    {activeProject.metricValue}
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {activeProject.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {activeProject.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono px-3 py-1 rounded-lg bg-white/10 text-cyan-300 border border-cyan-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                {activeProject.liveUrl && activeProject.liveUrl.startsWith('http') && (
                  <a
                    href={activeProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ss-glass-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  >
                    <span>Open Live Project</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const title = activeProject.title;
                    setActiveProject(null);
                    onStartSimilarProject(`Similar to: ${title}`);
                  }}
                  className="keep-white-text ss-cta-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                  }}
                >
                  <span>Build Something Like This</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
