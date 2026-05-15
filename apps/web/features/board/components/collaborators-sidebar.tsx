"use client";

import { Users } from "lucide-react";

import { useBoardStore } from "@/features/board/store/use-board-store";

export function CollaboratorsSidebar() {
  const collaborators = useBoardStore((state) => state.collaborators);

  return (
    <aside className="glass-panel w-72 rounded-3xl p-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-violet-300" />
        <h2 className="font-medium text-white">Collaborators</h2>
      </div>

      <div className="mt-4 space-y-3">
        {collaborators.length ? (
          collaborators.map((collaborator) => (
            <div key={collaborator.userId} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full" style={{ backgroundColor: collaborator.color }} />
                <div>
                  <p className="text-sm font-medium text-zinc-100">{collaborator.username}</p>
                  <p className="text-xs text-zinc-500">{collaborator.isEditing ? "Currently editing" : "Watching live"}</p>
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">Waiting for collaborators...</div>
        )}
      </div>
    </aside>
  );
}
