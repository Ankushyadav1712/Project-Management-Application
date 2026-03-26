import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { cn, formatDate, getInitials } from "../../lib/utils";
import { Plus, Loader2, Trash2, Circle, Clock, CheckCircle2 } from "lucide-react";

type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "low" | "medium" | "high";

interface Task {
  _id: string; title: string; description?: string;
  status: TaskStatus; priority: TaskPriority; dueDate?: string;
  assignedTo?: { _id: string; name: string; };
}
interface Project { _id: string; name: string; emoji: string; description?: string; workspace: string; }

const STATUS_COLUMNS: { key: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "todo", label: "To Do", icon: <Circle size={14} />, color: "text-gray-400" },
  { key: "in-progress", label: "In Progress", icon: <Clock size={14} />, color: "text-amber-500" },
  { key: "done", label: "Done", icon: <CheckCircle2 size={14} />, color: "text-green-500" },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  medium: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  high: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
};

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { data: projectData, isLoading: projLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data as { project: Project }),
    enabled: !!id,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => api.get(`/projects/${id}/tasks`).then(r => r.data as { tasks: Task[] }),
    enabled: !!id,
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: { title: string; status: TaskStatus }) =>
      api.post(`/projects/${id}/tasks`, { ...data, workspaceId: project?.workspace }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      setNewTaskTitle("");
      setShowForm(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string; status?: TaskStatus }) =>
      api.patch(`/tasks/${taskId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", id] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", id] }),
  });

  const project: Project | undefined = projectData?.project;
  const tasks: Task[] = tasksData?.tasks || [];

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const handleAddTask = (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({ title: newTaskTitle.trim(), status });
  };

  if (projLoading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{project?.emoji}</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project?.name}</h1>
            {project?.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {tasksLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_COLUMNS.map(col => (
            <div key={col.key} className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-3">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className={cn("flex items-center gap-1.5 font-semibold text-sm", col.color)}>
                  {col.icon}
                  {col.label}
                  <span className="ml-1 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full px-1.5 py-0.5">
                    {tasksByStatus(col.key).length}
                  </span>
                </div>
                <button
                  onClick={() => { setShowForm(col.key); setNewTaskTitle(""); }}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition"
                  title="Add task"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Quick Add Form */}
              {showForm === col.key && (
                <div className="mb-2 bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleAddTask(col.key);
                      if (e.key === "Escape") setShowForm(null);
                    }}
                    placeholder="Task title..."
                    className="w-full text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAddTask(col.key)}
                      disabled={createTaskMutation.isPending}
                      className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition"
                    >
                      {createTaskMutation.isPending ? "Adding..." : "Add"}
                    </button>
                    <button
                      onClick={() => setShowForm(null)}
                      className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Task Cards */}
              <div className="space-y-2">
                {tasksByStatus(col.key).map(task => (
                  <div
                    key={task._id}
                    className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition cursor-pointer group"
                    onClick={() => navigate(`/task/${task._id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                        {task.title}
                      </p>
                      <button
                        onClick={e => { e.stopPropagation(); deleteTaskMutation.mutate(task._id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2.5">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", PRIORITY_COLORS[task.priority])}>
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {task.dueDate && (
                          <span className="text-xs text-gray-400">{formatDate(task.dueDate)}</span>
                        )}
                        {task.assignedTo && (
                          <div
                            className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-900 flex items-center justify-center"
                            title={task.assignedTo.name}
                          >
                            <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                              {getInitials(task.assignedTo.name)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Status mover */}
                    <div
                      className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition"
                      onClick={e => e.stopPropagation()}
                    >
                      {STATUS_COLUMNS.filter(s => s.key !== col.key).map(s => (
                        <button
                          key={s.key}
                          onClick={() => updateTaskMutation.mutate({ taskId: task._id, status: s.key })}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 hover:border-indigo-400 transition",
                            s.color
                          )}
                        >
                          → {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {tasksByStatus(col.key).length === 0 && !showForm && (
                <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-6">No tasks yet</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
