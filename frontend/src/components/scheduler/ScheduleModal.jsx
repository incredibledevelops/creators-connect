"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import PlatformPicker from "./PlatformPicker";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function ScheduleModal({ open, onClose, onCreated }) {
  const toast = useToast();
  
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState(["IG"]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("18:30");
  
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectFiles, setProjectFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Fetch projects and connected accounts at the same time
      Promise.all([
        api.get("/projects?limit=100"),
        api.get("/accounts")
      ]).then(([projectsRes, accountsRes]) => {
        setProjects(projectsRes.projects || []);
        setConnectedAccounts(accountsRes.accounts || []);
      }).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectFiles([]);
      setSelectedFileId("");
      return;
    }
    api.get(`/projects/${selectedProjectId}`).then((res) => {
      setProjectFiles(res.project?.files || []);
      setSelectedFileId("");
    }).catch(console.error);
  }, [selectedProjectId]);

  const togglePlatform = (value) => {
    setPlatforms((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  // Check if all selected platforms are connected
  const unconnectedPlatforms = platforms.filter(
    (p) => !connectedAccounts.some((acc) => acc.platform === p)
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!platforms.length) {
      toast.show("Pick at least one platform", "error");
      return;
    }
    if (unconnectedPlatforms.length > 0) {
      toast.show(`Please connect your ${unconnectedPlatforms.join(", ")} account in Settings first.`, "error");
      return;
    }

    setLoading(true);
    try {
      const scheduled_for = new Date(`${date}T${time}:00`).toISOString();
      
      let media = [];
      if (selectedFileId) {
        const fileObj = projectFiles.find(f => f.drive_file_id === selectedFileId);
        if (fileObj) {
          media.push({
            drive_file_id: fileObj.drive_file_id,
            name: fileObj.name,
            mime_type: fileObj.mime_type,
            web_view_link: fileObj.web_view_link
          });
        }
      }

      await api.post("/schedule", {
        caption,
        platforms,
        scheduled_for,
        project_id: selectedProjectId || null,
        media: media
      });
      
      toast.show("Post scheduled successfully.");
      setCaption("");
      setSelectedProjectId("");
      setSelectedFileId("");
      onCreated?.();
    } catch (e) {
      toast.show(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule a post" description="Attach media and queue it for publishing.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">Platforms</label>
          <PlatformPicker selected={platforms} onToggle={togglePlatform} />
          
          {unconnectedPlatforms.length > 0 && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
              You haven't connected: <span className="font-bold">{unconnectedPlatforms.join(", ")}</span>. 
              <Link href="/settings" className="underline font-bold ml-1 hover:text-rose-900">
                Go to Settings to connect
              </Link>
            </div>
          )}
        </div>

        <Textarea
          label="Caption"
          rows={3}
          placeholder="Write your caption…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <div>
          <label className="block text-sm font-semibold text-ink mb-1.5">Attach Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">-- No project (Text only post) --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProjectId && (
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Select Media (from Google Drive)</label>
            {projectFiles.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                This project has no files yet. Upload some media in the Projects tab first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {projectFiles.map((file) => (
                  <label 
                    key={file.drive_file_id} 
                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-xs ${
                      selectedFileId === file.drive_file_id 
                        ? "border-brand-500 bg-brand-50" 
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="media_file"
                      value={file.drive_file_id}
                      checked={selectedFileId === file.drive_file_id}
                      onChange={() => setSelectedFileId(file.drive_file_id)}
                      className="w-3 h-3 text-brand-600"
                    />
                    <span className="truncate font-semibold text-ink">{file.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || unconnectedPlatforms.length > 0} 
            className="flex-1"
          >
            {loading ? "Scheduling…" : "Add to queue"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}