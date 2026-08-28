"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clapperboard, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  createProductionRole,
  updateProductionRole,
  deleteProductionRole,
} from "@/app/actions/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ManagedRole = {
  id: string;
  name: string;
  assignmentCount: number;
};

export function RolesManager({ roles }: { roles: ManagedRole[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [adding, startAdd] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editing, startEdit] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startAdd(async () => {
      const fd = new FormData();
      fd.set("name", name);
      const res = await createProductionRole(undefined, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setNewName("");
      router.refresh();
    });
  };

  const saveRename = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    setError(null);
    startEdit(async () => {
      const fd = new FormData();
      fd.set("name", name);
      const res = await updateProductionRole(editingId, undefined, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    setError(null);
    startDelete(async () => {
      const res = await deleteProductionRole(id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Production roles</h2>
          <p className="text-sm text-muted-foreground">
            The crew roles available when assigning people to shoots.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New role name"
            className="h-9 sm:w-52"
          />
          <Button size="sm" className="h-9 gap-1.5" onClick={add} disabled={adding || !newName.trim()}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
          <Clapperboard className="mb-2 size-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No roles yet — add your first above.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {roles.map((role) =>
            editingId === role.id ? (
              <div key={role.id} className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-8 w-40"
                />
                <Button size="icon" variant="ghost" className="size-8" onClick={saveRename} disabled={editing}>
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => setEditingId(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <span
                key={role.id}
                className="group inline-flex items-center gap-1 rounded-full border bg-card py-1 pl-3 pr-1"
              >
                <span className="text-sm">{role.name}</span>
                {role.assignmentCount > 0 && (
                  <Badge variant="secondary" className="px-1.5 text-[10px] tabular-nums">
                    {role.assignmentCount}
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setEditingId(role.id);
                    setEditName(role.name);
                  }}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                  aria-label={`Rename ${role.name}`}
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  onClick={() => remove(role.id)}
                  disabled={pendingDelete}
                  className="rounded-full p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                  aria-label={`Delete ${role.name}`}
                >
                  <Trash2 className="size-3" />
                </button>
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}