import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { cn, getInitials } from "../lib/utils";
import {
  LayoutDashboard, Plus, ChevronDown,
  LogOut, Settings, Menu, X, Briefcase,
} from "lucide-react";

interface Workspace { _id: string; name: string; }
interface Project { _id: string; name: string; emoji: string; }

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const workspaceId = location.pathname.split("/workspace/")[1]?.split("/")[0]
    || user?.currentWorkspace || "";

  const { data: workspacesData } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.get("/workspaces").then((r) => r.data as { workspaces: Workspace[] }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects`).then((r) => r.data as { projects: Project[] }),
    enabled: !!workspaceId,
  });

  const workspaces: Workspace[] = workspacesData?.workspaces || [];
  const projects: Project[] = projectsData?.projects || [];

  const currentWorkspace = workspaces.find(w => w._id === workspaceId);

  const handleLogout = async () => { await logout(); navigate("/sign-in"); };

  const navItem = (to: string, icon: React.ReactNode, label: string) => {
    const active = location.pathname === to;
    return (
      <Link to={to} key={to}
        className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
          active ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white")}>
        {icon}
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  return (
    <aside className={cn("h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300",
      collapsed ? "w-[60px]" : "w-[260px]")}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">ProjectManager</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Workspace Switcher */}
      {!collapsed && (
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <div className="flex items-center gap-2">
              <Briefcase size={15} className="text-indigo-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                {currentWorkspace?.name || "Select Workspace"}
              </span>
            </div>
            <ChevronDown size={14} className={cn("text-gray-400 transition-transform", workspaceOpen && "rotate-180")} />
          </button>
          {workspaceOpen && (
            <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
              {workspaces.map(ws => (
                <button key={ws._id} onClick={() => { navigate(`/workspace/${ws._id}`); setWorkspaceOpen(false); }}
                  className={cn("w-full text-left px-3 py-2 text-sm transition hover:bg-gray-100 dark:hover:bg-gray-700",
                    ws._id === workspaceId ? "text-indigo-600 dark:text-indigo-400 font-medium" : "text-gray-600 dark:text-gray-400")}>
                  {ws.name}
                </button>
              ))}
              <button onClick={() => { navigate("/create-workspace"); setWorkspaceOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Plus size={12} /> New Workspace
              </button>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItem(workspaceId ? `/workspace/${workspaceId}` : "/", <LayoutDashboard size={17} />, "Dashboard")}
        {!collapsed && projects.length > 0 && (
          <div className="pt-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Projects</p>
            {projects.map(p => (
              <Link key={p._id} to={`/project/${p._id}`}
                className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                  location.pathname === `/project/${p._id}`
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800")}>
                <span>{p.emoji}</span>
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
            {workspaceId && (
              <button onClick={() => navigate(`/workspace/${workspaceId}/new-project`)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <Plus size={13} /> New Project
              </button>
            )}
          </div>
        )}
        {!collapsed && <div className="pt-2"><p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">More</p></div>}
        {navItem("/settings", <Settings size={17} />, "Settings")}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <div className={cn("flex items-center gap-2 px-2 py-2 rounded-lg", !collapsed && "justify-between")}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{getInitials(user?.name || "?")}</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={handleLogout} title="Logout"
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
