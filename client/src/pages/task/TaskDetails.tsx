import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { formatDate, getInitials } from "../../lib/utils";
import { ArrowLeft, Loader2, Save, Trash2, Send, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

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

interface Comment {
  _id: string;
  content: string;
  author: { _id: string; name: string; profilePicture?: string };
  createdAt: string;
}

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: taskData, isLoading: isTaskLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => api.get(`/tasks/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: commentsData, isLoading: isCommentsLoading } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api.get(`/tasks/${id}/comments`).then(r => r.data),
    enabled: !!id,
  });

  const task: Task = taskData?.task;
  const comments: Comment[] = commentsData?.comments || [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [initialized, setInitialized] = useState(false);
  
  const [newComment, setNewComment] = useState("");

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
      toast.success("Task updated");
    },
    onError: () => toast.error("Failed to update task"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      navigate(`/project/${task.project._id}`);
      toast.success("Task deleted");
    },
    onError: () => toast.error("Failed to delete task"),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/tasks/${id}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      setNewComment("");
      toast.success("Comment added");
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  if (isTaskLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition">
        <ArrowLeft size={16} /> Back to Project
      </button>

      {/* Task Details Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <span className="hover:text-indigo-500 cursor-pointer transition-colors" onClick={() => navigate(`/workspace/${task?.workspace?._id}`)}>{task?.workspace?.name}</span>
          <span>/</span>
          <span className="hover:text-indigo-500 cursor-pointer transition-colors" onClick={() => navigate(`/project/${task?.project?._id}`)}>{task?.project?.emoji} {task?.project?.name}</span>
        </div>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)}
          className="w-full text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 rounded-lg px-2 py-1 -ml-2 mb-4 transition-shadow" />

        {/* Fields Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow transition-colors">
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow transition-colors">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow transition-colors" />
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
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-shadow transition-colors" />
        </div>

        {/* Metadata */}
        {task?.createdAt && (
          <p className="text-xs text-gray-400 mb-6">Created {formatDate(task.createdAt)}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={() => deleteTaskMutation.mutate()}
            disabled={deleteTaskMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition font-medium">
            {deleteTaskMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete Task
          </button>
          <button onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition shadow-sm hover:shadow disabled:opacity-70">
            {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Activity / Comments Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-gray-400" /> Activity
        </h3>

        {/* Comments List */}
        <div className="space-y-4 mb-6">
          {isCommentsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No comments yet. Start the conversation!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  {getInitials(comment.author?.name || "?")}
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-2xl rounded-tl-none p-3 border border-gray-100 dark:border-gray-800/80">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.author?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.createdAt)}</span>
                      {comment.author?._id === user?._id && (
                        <button 
                          onClick={() => deleteCommentMutation.mutate(comment._id)}
                          disabled={deleteCommentMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Input */}
        <form onSubmit={handleAddComment} className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex flex-shrink-0 flex-col items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-400 mt-1">
            {getInitials(user?.name || "?")}
          </div>
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ask a question or post an update..."
              className="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-shadow min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment(e);
                }
              }}
            />
            <div className="absolute right-2 bottom-3">
              <button
                type="submit"
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition flex items-center justify-center shadow-sm"
              >
                {addCommentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
}
