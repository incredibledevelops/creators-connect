"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ProjectGrid from "@/components/projects/ProjectGrid";
import NewProjectModal from "@/components/projects/NewProjectModal";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects?limit=60");
      setProjects(res.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">
            Share work, collect feedback, and keep every version in one place.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-soft transition"
        >
          + New project
        </button>
      </div>

      <ProjectGrid projects={projects} loading={loading} onReload={load} />

      <NewProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}