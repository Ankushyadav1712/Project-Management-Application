import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, FolderKanban, CheckSquare, Loader2, X } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface SearchResult {
  projects: { _id: string; name: string; emoji: string }[];
  tasks: { _id: string; title: string; project: { _id: string; name: string; emoji: string } }[];
}

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setSelectedIndex(0);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", user?.currentWorkspace, debouncedQuery],
    queryFn: () => api.get(`/search?q=${debouncedQuery}&workspaceId=${user?.currentWorkspace}`).then(r => r.data),
    enabled: !!debouncedQuery && debouncedQuery.length > 1 && !!user?.currentWorkspace,
  });

  const results: SearchResult = data || { projects: [], tasks: [] };
  const allItems = [
    ...results.projects.map(p => ({ ...p, type: 'project' as const })),
    ...results.tasks.map(t => ({ ...t, type: 'task' as const })),
  ];
  const hasResults = allItems.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && hasResults) {
      e.preventDefault();
      const selected = allItems[selectedIndex];
      if (selected) {
        if (selected.type === "project") navigate(`/project/${selected._id}`);
        if (selected.type === "task") navigate(`/task/${selected._id}`);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <SearchIcon size={20} className="text-gray-400 min-w-[20px]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects and tasks..."
            className="flex-1 bg-transparent border-none px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
            onKeyDown={handleKeyDown}
          />
          {isLoading && query.length > 1 && (
            <Loader2 size={16} className="text-gray-400 animate-spin min-w-[16px] mr-2" />
          )}
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
          {!query && (
            <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-3">
              <SearchIcon size={32} className="text-gray-300 dark:text-gray-700" />
              <p>Type to search across your workspace</p>
            </div>
          )}

          {query.length > 1 && !isLoading && !hasResults && (
            <div className="p-8 text-center text-sm text-gray-500">
              No results found for "{query}"
            </div>
          )}

          {hasResults && (
            <div className="py-2">
              {/* Projects */}
              {results.projects.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Projects
                  </div>
                  {results.projects.map((project) => {
                    const globalIdx = allItems.findIndex(i => i._id === project._id);
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <button
                        key={project._id}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => { navigate(`/project/${project._id}`); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left group ${
                          isSelected ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800/80"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          {project.emoji || <FolderKanban size={16} />}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{project.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tasks
                  </div>
                  {results.tasks.map((task) => {
                    const globalIdx = allItems.findIndex(i => i._id === task._id);
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <button
                        key={task._id}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => { navigate(`/task/${task._id}`); onClose(); }}
                        className={`w-full flex flex-col justify-center px-3 py-2 rounded-xl transition text-left group ${
                          isSelected ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800/80"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckSquare size={14} className="text-gray-400 group-hover:text-indigo-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{task.title}</span>
                        </div>
                        <span className="text-xs text-gray-500 ml-6 pl-0.5 mt-0.5">
                          in {task.project?.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500">
          <span>Navigate with arrows</span>
          <div className="flex gap-2">
            <span className="bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 shadow-sm">esc</span> to close
          </div>
        </div>
      </div>
    </div>
  );
}
