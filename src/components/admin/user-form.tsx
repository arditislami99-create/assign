"use client";

import { useActionState, useEffect } from "react";

import type { UserFormState } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@prisma/client";

export function UserForm({
  action,
  user,
  submitLabel = "Save",
  onSuccess,
}: {
  action: (prev: UserFormState, formData: FormData) => Promise<UserFormState>;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
  };
  submitLabel?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(action, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="u-name">Full name</Label>
          <Input id="u-name" name="name" placeholder="Alex Rivera" defaultValue={user?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-email">Email</Label>
          <Input id="u-email" name="email" type="email" placeholder="alex@studio.com" defaultValue={user?.email} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-phone">Phone (optional)</Label>
          <Input id="u-phone" name="phone" type="tel" placeholder="(310) 555-0100" defaultValue={user?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-role">Role</Label>
          <Select name="role" defaultValue={user?.role ?? "STAFF"}>
            <SelectTrigger id="u-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="ADMIN">Admin / Producer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="u-password">
            {user ? "New password (leave blank to keep current)" : "Password"}
          </Label>
          <Input
            id="u-password"
            name="password"
            type="password"
            placeholder={user ? "••••••••" : "At least 8 characters"}
            autoComplete="new-password"
            minLength={user ? 0 : 8}
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}