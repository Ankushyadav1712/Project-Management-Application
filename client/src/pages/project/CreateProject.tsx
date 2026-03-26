import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMOJIS = ["📋", "🚀", "💡", "🎯", "🔥", "🛠️", "📊", "🎨", "🌟", "⚡"];

const schema = z.object({
  name: z.string().min(2, "Name too short"),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CreateProject() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEmoji, setSelectedEmoji] = useState("📋");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post(`/workspaces/${workspaceId}/projects`, {
        ...data,
        emoji: selectedEmoji,
      });
      await queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      toast.success("Project created");
      navigate(`/project/${res.data.project._id}`);
    } catch (err: unknown) {
      interface ApiError { response?: { data?: { message?: string } } }
      const errorMsg = (err as ApiError)?.response?.data?.message || "Failed to create project";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create Project</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Add a new project to your workspace
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 text-sm border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setSelectedEmoji(e)}
                  className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition border-2 ${
                    selectedEmoji === e
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                      : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Project Name *
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Website Redesign"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="What is this project about?"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
