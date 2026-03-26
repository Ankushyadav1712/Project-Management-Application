import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { BarChart3, FolderKanban, CheckCircle2, Clock, Loader2, ArrowRight } from "lucide-react";

interface RecentTask { _id: string; title: string; status: string; priority: string; project: { name: string; emoji: string }; }

interface PriorityStat { _id: string; count: number; }
interface ProjectStat { name: string; count: number; }

interface Analytics {
  totalProjects: number; totalTasks: number;
  todoTasks: number; inProgressTasks: number; doneTasks: number;
  recentTasks: RecentTask[];
  tasksByPriority: PriorityStat[];
  tasksPerProject: ProjectStat[];
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  medium: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  high: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
};

const CHART_COLORS = {
  blue: "#6366f1",
  green: "#22c55e",
  amber: "#f59e0b",
  gray: "#9ca3af",
  red: "#ef4444"
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

  const analytics: Analytics = data || { 
    totalProjects: 0, totalTasks: 0, todoTasks: 0, inProgressTasks: 0, doneTasks: 0, 
    recentTasks: [], tasksByPriority: [], tasksPerProject: [] 
  };
  
  const statusData = [
    { name: "To Do", value: analytics.todoTasks, color: CHART_COLORS.gray },
    { name: "In Progress", value: analytics.inProgressTasks, color: CHART_COLORS.amber },
    { name: "Done", value: analytics.doneTasks, color: CHART_COLORS.green },
  ].filter(d => d.value > 0);

  const priorityData = analytics.tasksByPriority.map(p => ({
    name: p._id.charAt(0).toUpperCase() + p._id.slice(1),
    value: p.count,
    color: p._id === 'high' ? CHART_COLORS.red : p._id === 'medium' ? CHART_COLORS.amber : CHART_COLORS.blue
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
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

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Task Status Donut Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Task Completion</h2>
              {analytics.totalTasks === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No tasks to display</div>
              ) : (
                <div className="h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Tasks Per Project Bar Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Tasks per Project</h2>
              {analytics.tasksPerProject.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No projects to display</div>
              ) : (
                <div className="h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.tasksPerProject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Priority Breakdown Pie Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Priority Breakdown</h2>
              {analytics.tasksByPriority.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400 py-10">No priority data</div>
              ) : (
                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%" cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Recent Tasks */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
                <button 
                  onClick={() => navigate('/tasks')} 
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                >
                  View all
                </button>
              </div>
              
              {analytics.recentTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No tasks yet. Start by creating a project!</div>
              ) : (
                <div className="space-y-2 flex-1">
                  {analytics.recentTasks.map(task => (
                    <div key={task._id} onClick={() => navigate(`/task/${task._id}`)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition group border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg shadow-inner">
                          {task.project?.emoji}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-[200px] truncate">{task.project?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                        {task.status === 'done' ? (
                           <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md font-medium"><CheckCircle2 size={12}/> Done</span>
                        ) : (
                           <span className={`text-xs px-2.5 py-1 rounded-md font-medium border border-transparent ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                        )}
                        <div className="w-8 flex justify-end">
                          <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>
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
