"use client";

import { Users } from "lucide-react";

import { useBoardStore } from "@/features/board/store/use-board-store";

export function CollaboratorsSidebar() {
  const collaborators = useBoardStore((state) => state.collaborators);

  return (
    <aside className="glass-panel w-72 rounded-3xl p-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-[#E7C494]" />
        <h2 className="font-medium text-[#FFF5DF]">Collaborators</h2>
      </div>

      <div className="mt-4 space-y-3">
        {collaborators.length ? (
          collaborators.map((collaborator) => (
            <div key={collaborator.userId} className="flex items-center justify-between rounded-2xl border border-[#E7C494]/15 bg-[#E7C494]/8 p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full" style={{ backgroundColor: collaborator.color }} />
                <div>
                  <p className="text-sm font-medium text-[#FFF5DF]">{collaborator.username}</p>
                  <p className="text-xs text-[#BFA07B]">{collaborator.isEditing ? "Currently editing" : "Watching live"}</p>
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-[#D8943B]" />
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E7C494]/20 p-4 text-sm text-[#BFA07B]">Waiting for collaborators...</div>
        )}
      </div>
    </aside>
  );
}
