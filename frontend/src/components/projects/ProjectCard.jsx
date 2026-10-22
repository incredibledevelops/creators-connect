"use client";

import Link from "next/link";

export default function ProjectCard({ project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-card hover:border-brand-200 transition"
    >
      <div className="relative h-36 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <span className="absolute top-3 left-3 text-[10px] font-bold bg-white/95 text-ink px-2 py-1 rounded-md uppercase">
          {(project.status || "draft").replace("_", " ")}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display font-bold text-ink truncate">{project.name}</h3>
        <p className="text-xs text-slate-500 mt-1">
          {project.files?.length || 0} files · updated{" "}
          {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : "—"}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(project.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {project.members?.length ? `${project.members.length + 1} collaborators` : "Just you"}
          </p>
          <span className="text-xs font-bold text-brand-600">Open →</span>
        </div>
      </div>
    </Link>
  );
}