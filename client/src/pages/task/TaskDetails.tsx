import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { formatDate } from "../../lib/utils";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";

type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "low" | "medium" | "high";

interface Task {
  _id: string; title: string; description?: string;
  status: TaskStatus; priority: TaskPriority; dueDate?: string;
  project: { _id: string; name: string; emoji: string; };
  workspace: { _id: string; name: string; };
  assignedTo?: { _id: string; name: string; };
  createdBy: { name: string; };
  createdAt: string;
}

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => api.get(`/tasks/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const task: Task = data?.task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (task && !initialized) {
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/tasks/${id}`, { title, description, status, priority, dueDate: dueDate || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${id}`),
    onSuccess: () => navigate(`/project/${task.project._id}`),
  });

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition">
        <ArrowLeft size={16} /> Back to Project
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <span className="hover:text-indigo-500 cursor-pointer" onClick={() => navigate(`/workspace/${task?.workspace?._id}`)}>{task?.workspace?.name}</span>
          <span>/</span>
          <span className="hover:text-indigo-500 cursor-pointer" onClick={() => navigate(`/project/${task?.project?._id}`)}>{task?.project?.emoji} {task?.project?.name}</span>
        </div>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)}
          className="w-full text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 rounded-lg px-2 py-1 -ml-2 mb-4" />

        {/* Fields Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created By</label>
            <p className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{task?.createdBy?.name}</p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
            placeholder="Add a description..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        {/* Metadata */}
        {task?.createdAt && (
          <p className="text-xs text-gray-400 mb-6">Created {formatDate(task.createdAt)}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition font-medium">
            {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete Task
          </button>
          <button onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-70">
            {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
