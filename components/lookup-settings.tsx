"use client";

import { useActionState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mutateLookup, type LookupState } from "@/lib/actions/lookups";
import { LOOKUP_LISTS, type LookupListKey } from "@/lib/lookup-lists";

export type EditableLookupOption = {
  id: string;
  listKey: string;
  value: string;
  label: string;
  position: number;
};

export type EditableLookupCatalog = Record<LookupListKey, EditableLookupOption[]>;

export function LookupSettings({ catalog }: { catalog: EditableLookupCatalog }) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {LOOKUP_LISTS.map((list) => (
        <LookupListCard
          key={list.key}
          listKey={list.key}
          title={list.title}
          description={list.description}
          placeholder={list.placeholder}
          options={catalog[list.key]}
        />
      ))}
    </div>
  );
}

function LookupListCard({
  listKey,
  title,
  description,
  placeholder,
  options,
}: {
  listKey: string;
  title: string;
  description: string;
  placeholder: string;
  options: EditableLookupOption[];
}) {
  const [addState, addAction, adding] = useActionState(mutateLookup, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={addAction} className="space-y-3 rounded-xl border bg-surface p-3">
          <input type="hidden" name="intent" value="add" />
          <input type="hidden" name="listKey" value={listKey} />
          <div className="space-y-2">
            <Label htmlFor={`${listKey}-label`}>New option</Label>
            <Input
              id={`${listKey}-label`}
              name="label"
              placeholder={placeholder}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${listKey}-value`}>Value</Label>
            <Input
              id={`${listKey}-value`}
              name="value"
              placeholder="Optional short code"
            />
          </div>
          <Button type="submit" disabled={adding}>
            <Plus data-icon="inline-start" />
            {adding ? "Adding..." : "Add option"}
          </Button>
          <LookupMessage state={addState} />
        </form>

        {options.length === 0 ? (
          <p className="text-sm text-content-muted">
            No options yet. Add the first one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {options.map((option, index) => (
              <LookupOptionRow
                key={option.id}
                option={option}
                isFirst={index === 0}
                isLast={index === options.length - 1}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LookupOptionRow({
  option,
  isFirst,
  isLast,
}: {
  option: EditableLookupOption;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [state, formAction, pending] = useActionState(mutateLookup, {});

  return (
    <li className="space-y-2 rounded-xl border px-3 py-3">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="intent" value="update" />
        <input type="hidden" name="id" value={option.id} />
        <div className="min-w-40 flex-1 space-y-1">
          <Label htmlFor={`label-${option.id}`} className="sr-only">
            Label
          </Label>
          <Input
            id={`label-${option.id}`}
            name="label"
            defaultValue={option.label}
            required
          />
          <p className="text-xs text-content-muted">Value: {option.value}</p>
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <form action={formAction}>
          <input type="hidden" name="intent" value="move" />
          <input type="hidden" name="id" value={option.id} />
          <input type="hidden" name="direction" value="up" />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={isFirst || pending}
            aria-label={`Move ${option.label} up`}
          >
            <ChevronUp />
          </Button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="intent" value="move" />
          <input type="hidden" name="id" value={option.id} />
          <input type="hidden" name="direction" value="down" />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={isLast || pending}
            aria-label={`Move ${option.label} down`}
          >
            <ChevronDown />
          </Button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="id" value={option.id} />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label={`Delete ${option.label}`}
            onClick={(event) => {
              if (!window.confirm(`Remove ${option.label} from this list?`)) {
                event.preventDefault();
              }
            }}
          >
            <Trash2 />
          </Button>
        </form>
      </div>
      <LookupMessage state={state} />
    </li>
  );
}

function LookupMessage({ state }: { state: LookupState }) {
  if (!state.error) return null;
  return (
    <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
      {state.error}
    </p>
  );
}
