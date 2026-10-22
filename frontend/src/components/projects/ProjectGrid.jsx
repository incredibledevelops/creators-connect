"use client";

import ProjectCard from "./ProjectCard";

export default function ProjectGrid({ projects, loading, onReload }) {
  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="text-center py-20 text-slate-500 text-sm">
        No projects yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}