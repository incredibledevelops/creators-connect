"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import MemberList from "@/components/projects/MemberList";
import FileList from "@/components/projects/FileList";
import UploadZone from "@/components/projects/UploadZone";
import { useToast } from "@/lib/toast";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.project);
    } catch (e) {
      setError(e.message || "Could not load project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status) => {
    try {
      const res = await api.patch(`/projects/${id}`, { status });
      setProject(res.project);
      toast.show(`Status updated to ${status}`);
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{error || "Project not found."}</p>
        <Link href="/projects" className="text-brand-600 font-semibold mt-4 inline-block">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link href="/projects" className="text-xs font-semibold text-slate-500 hover:text-ink">
            ← Projects
          </Link>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-slate-600 text-sm mt-2 max-w-2xl">{project.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {["draft", "in_review", "approved"].map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition ${
                project.status === s
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-display font-bold text-ink">Files</h2>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {project.files?.length || 0}
              </span>
            </div>
            <div className="p-5">
              <FileList files={project.files || []} projectId={id} onReload={load} />
            </div>
          </div>
          <UploadZone projectId={id} onUploaded={load} />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-display font-bold text-ink">Team</h2>
            </div>
            <div className="p-5">
              <MemberList
                owner={project.owner}
                members={project.member_profiles || []}
                projectId={id}
                onReload={load}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}