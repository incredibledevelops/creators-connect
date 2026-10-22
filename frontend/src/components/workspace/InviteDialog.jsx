"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function InviteDialog({ open, onClose, onInvited }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/workspace/invite", { email, role });
      toast.show("Invitation sent!");
      setEmail("");
      onInvited?.();
    } catch (err) {
      toast.show(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite a member" description="They will receive an email with a link to join your workspace.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="colleague@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="editor">Editor (can upload and edit)</option>
          <option value="viewer">Viewer (can only view)</option>
          <option value="client">Client (can comment and approve)</option>
        </Select>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}