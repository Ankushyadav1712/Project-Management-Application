import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { BarChart3, FolderKanban, CheckCircle2, Clock, Circle, Loader2, ArrowRight } from "lucide-react";


interface RecentTask { _id: string; title: string; status: string; priority: string; project: { name: string; emoji: string }; }
interface Analytics {
  totalProjects: number; totalTasks: number;
  todoTasks: number; inProgressTasks: number; doneTasks: number;
  recentTasks: RecentTask[];
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  medium: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  high: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const workspaceId = location.pathname.split("/workspace/")[1]?.split("/")[0] || user?.currentWorkspace;

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/analytics`).then(r => r.data),
    enabled: !!workspaceId,
  });

  const analytics: Analytics = data || { totalProjects: 0, totalTasks: 0, todoTasks: 0, inProgressTasks: 0, doneTasks: 0, recentTasks: [] };
  const donePercent = analytics.totalTasks > 0 ? Math.round((analytics.doneTasks / analytics.totalTasks) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Good day, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening in your workspace</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Projects", value: analytics.totalProjects, icon: <FolderKanban size={20} />, bg: "bg-indigo-500", light: "bg-indigo-50 dark:bg-indigo-950" },
              { label: "Total Tasks", value: analytics.totalTasks, icon: <BarChart3 size={20} />, bg: "bg-purple-500", light: "bg-purple-50 dark:bg-purple-950" },
              { label: "In Progress", value: analytics.inProgressTasks, icon: <Clock size={20} />, bg: "bg-amber-500", light: "bg-amber-50 dark:bg-amber-950" },
              { label: "Done", value: analytics.doneTasks, icon: <CheckCircle2 size={20} />, bg: "bg-green-500", light: "bg-green-50 dark:bg-green-950" },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                <div className={`inline-flex p-2.5 rounded-xl mb-3 ${stat.light}`}>
                  <span className={`${stat.bg} rounded-lg p-1.5 text-white`}>{stat.icon}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Progress + Recent Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Overall Progress</h2>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Completion rate</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{donePercent}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-4">
                <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${donePercent}%` }} />
              </div>
              <div className="space-y-2 mt-4">
                {[
                  { label: "To Do", count: analytics.todoTasks, icon: <Circle size={13} />, color: "text-gray-400" },
                  { label: "In Progress", count: analytics.inProgressTasks, icon: <Clock size={13} />, color: "text-amber-500" },
                  { label: "Done", count: analytics.doneTasks, icon: <CheckCircle2 size={13} />, color: "text-green-500" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <div className={`flex items-center gap-1.5 ${s.color}`}>{s.icon}<span className="text-gray-600 dark:text-gray-400">{s.label}</span></div>
                    <span className="font-semibold text-gray-900 dark:text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Tasks</h2>
              {analytics.recentTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No tasks yet. Start by creating a project!</p>
              ) : (
                <div className="space-y-2">
                  {analytics.recentTasks.map(task => (
                    <div key={task._id} onClick={() => navigate(`/task/${task._id}`)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg">{task.project?.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{task.title}</p>
                          <p className="text-xs text-gray-400">{task.project?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                        <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
