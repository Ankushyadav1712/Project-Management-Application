import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Plus, FolderKanban, Users, BarChart3, Loader2, X, Send } from "lucide-react";
import { formatDate, getInitials } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

interface Project { _id: string; name: string; emoji: string; description?: string; createdAt: string; }
interface Member { user: { _id: string; name: string; email: string; }; role: string; }
interface Analytics { totalProjects: number; totalTasks: number; todoTasks: number; inProgressTasks: number; doneTasks: number; }

export default function WorkspaceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: wsData, isLoading: wsLoading } = useQuery({
    queryKey: ["workspace", id],
    queryFn: () => api.get(`/workspaces/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: projData } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => api.get(`/workspaces/${id}/projects`).then(r => r.data),
    enabled: !!id,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["analytics", id],
    queryFn: () => api.get(`/workspaces/${id}/analytics`).then(r => r.data),
    enabled: !!id,
  });

  const workspace = wsData?.workspace;
  const projects: Project[] = projData?.projects || [];
  const members: Member[] = workspace?.members || [];
  const analytics: Analytics = analyticsData || { totalProjects: 0, totalTasks: 0, todoTasks: 0, inProgressTasks: 0, doneTasks: 0 };
  
  const currentUserRole = members.find((m) => m.user._id === user?._id)?.role || "member";
  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

  const addMemberMutation = useMutation({
    mutationFn: (email: string) => api.post(`/workspaces/${id}/members`, { email, role: "member" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", id] });
      setInviteEmail("");
      toast.success("Member invited successfully");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to invite member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => api.delete(`/workspaces/${id}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", id] });
      toast.success("Member removed");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to remove member"),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    addMemberMutation.mutate(inviteEmail.trim());
  };

  if (wsLoading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{workspace?.name}</h1>
          {workspace?.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{workspace.description}</p>}
        </div>
        <button onClick={() => navigate(`/workspace/${id}/new-project`)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Projects", value: analytics.totalProjects, icon: <FolderKanban size={18} />, color: "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400" },
          { label: "Total Tasks", value: analytics.totalTasks, icon: <BarChart3 size={18} />, color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400" },
          { label: "In Progress", value: analytics.inProgressTasks, icon: <BarChart3 size={18} />, color: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400" },
          { label: "Done", value: analytics.doneTasks, icon: <BarChart3 size={18} />, color: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <div className={`inline-flex p-2 rounded-lg mb-2 ${stat.color}`}>{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderKanban size={18} className="text-indigo-500" /> Projects
            </h2>
          </div>
          {projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
              <FolderKanban size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No projects yet</p>
              <button onClick={() => navigate(`/workspace/${id}/new-project`)}
                className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                Create your first project →
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {projects.map(p => (
                <Link key={p._id} to={`/project/${p._id}`}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition group">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{p.name}</p>
                      {p.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{p.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">Created {formatDate(p.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-indigo-500" /> Members
            </h2>
          </div>

          {canManageMembers && (
            <form onSubmit={handleInvite} className="flex gap-2 mb-4">
              <input 
                type="email" 
                value={inviteEmail} 
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email to invite" 
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <button 
                type="submit" 
                disabled={addMemberMutation.isPending || !inviteEmail.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition"
              >
                {addMemberMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 dark:text-indigo-300 text-xs font-semibold">{getInitials(m.user.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === "owner" ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                    {m.role}
                  </span>
                  {(canManageMembers && m.role !== "owner" || m.user._id === user?._id) && (
                    <button 
                      onClick={() => removeMemberMutation.mutate(m.user._id)}
                      disabled={removeMemberMutation.isPending}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                      title={m.user._id === user?._id ? "Leave workspace" : "Remove member"}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
