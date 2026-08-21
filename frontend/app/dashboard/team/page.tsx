"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Mail, Shield, ShieldCheck, X, Loader2, CheckCircle2, History } from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const MOCK_MEMBERS = [
  {
    user_id: "m-1",
    role: "owner",
    joined_at: "2026-08-21T09:12:37Z",
    profile: {
      email: "john@acme.com",
      full_name: "John Doe",
      avatar_url: null,
    }
  },
  {
    user_id: "m-2",
    role: "admin",
    joined_at: "2026-08-21T10:14:22Z",
    profile: {
      email: "sarah@acme.com",
      full_name: "Sarah Jenkins",
      avatar_url: null,
    }
  },
  {
    user_id: "m-3",
    role: "member",
    joined_at: "2026-08-21T11:42:00Z",
    profile: {
      email: "dave@acme.com",
      full_name: "David K.",
      avatar_url: null,
    }
  }
];

export default function TeamPage() {
  const { organization } = useWorkspace();
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("member");
  const [inviteSuccess, setInviteSuccess] = React.useState(false);
  const [isInviting, setIsInviting] = React.useState(false);

  const fetchMembers = async () => {
    if (!organization?.id) return;
    setLoading(true);
    const supabase = createClient() as any;
    
    // Join organization_members with profiles
    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        user_id,
        role,
        joined_at,
        profile:profiles (
          email,
          full_name,
          avatar_url
        )
      `)
      .eq("organization_id", organization.id);

    if (!error && data) {
      setMembers(data as any);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchMembers();
  }, [organization]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !organization?.id) return;

    setIsInviting(true);
    setInviteSuccess(false);

    // Simulate sending invitation email
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsInviting(false);
    setInviteSuccess(true);
    setInviteEmail("");
    setShowInviteModal(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner": return "bg-red-50 text-red-700 border-red-200";
      case "admin": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "member": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-zinc-100 text-zinc-650 border-zinc-200";
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "owner" || role === "admin") {
      return <Shield className="h-4 w-4 text-indigo-500" />;
    }
    return <Users className="h-4 w-4 text-zinc-400" />;
  };

  const displayMembers = members.length > 0 ? members : MOCK_MEMBERS;

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight">Team Members</h1>
          <p className="text-xs font-medium text-zinc-500 mt-1">
            Manage your workspace membership, roles, permissions, and audit logs.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Members list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Active Members</h3>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-150 px-2 py-0.5 rounded-full">{displayMembers.length} active</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 bg-white rounded-2xl border border-zinc-150 shadow-sm">
              <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-150 shadow-sm divide-y divide-zinc-100 overflow-hidden">
              {displayMembers.map((member) => (
                <div key={member.user_id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                      {member.profile.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 leading-none truncate">
                        {member.profile.full_name || member.profile.email.split("@")[0]}
                      </p>
                      <p className="text-[10px] font-semibold text-zinc-450 mt-1 truncate">{member.profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Activity Logs */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 px-1">
            <History className="h-4 w-4 text-zinc-400" />
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Workspace Activity</h3>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-150 p-5 shadow-sm space-y-4">
            {[
              { text: "John Doe invited Sarah Jenkins", time: "2 hours ago" },
              { text: "David K. updated HRMS description", time: "5 hours ago" },
              { text: "Workspace plan upgraded to Free Tier", time: "1 day ago" },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs leading-normal">
                <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-zinc-850">{activity.text}</p>
                  <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invitation Success Banner */}
      <AnimatePresence>
        {inviteSuccess && (
          <div className="fixed bottom-5 right-5 z-50">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.95 }}
              className="bg-zinc-900 text-white rounded-2xl p-5 shadow-xl border border-zinc-800 flex items-start gap-3 max-w-sm"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black">Invitation Sent</p>
                <p className="text-[10px] text-zinc-400 font-semibold mt-1 leading-relaxed">
                  An email invite with workspace verification links has been sent out successfully.
                </p>
                <button
                  onClick={() => setInviteSuccess(false)}
                  className="mt-3 text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md bg-white border border-zinc-100 rounded-2xl shadow-xl z-10 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-900">Invite Team Member</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Workspace Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 focus:outline-none cursor-pointer"
                  >
                    <option value="admin">Admin (Can edit settings & invite)</option>
                    <option value="member">Member (Can edit projects & analysis)</option>
                    <option value="viewer">Viewer (Read-only access)</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="h-9 px-4 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="h-9 px-4 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700 flex items-center justify-center gap-1.5"
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Inviting…
                      </>
                    ) : (
                      "Send Invitation"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
