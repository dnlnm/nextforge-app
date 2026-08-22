"use client";

import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { cn } from "@repo/design-system/lib/utils";
import { PencilIcon } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { updateStudent } from "../actions";
import { IsoDatePicker } from "../components/iso-date-picker";

type EditableFieldType = "date" | "select" | "text" | "textarea";

interface EditableSelectOption {
  readonly label: string;
  readonly value: string;
}

interface EditableFieldProps {
  /** Formatted read-only view; defaults to a muted placeholder when empty. */
  readonly display?: ReactNode;
  /** Server field key sent to the updateStudent action. */
  readonly field: string;
  /** Accessible name for the edit affordance. */
  readonly label?: string;
  readonly options?: readonly EditableSelectOption[];
  /** Shown (with a + prefix) when the value is empty. */
  readonly placeholder?: string;
  readonly studentId: string;
  readonly type: EditableFieldType;
  /** Current machine value (ISO date, option value, or raw text). */
  readonly value: string | null;
}

/**
 * Per-field click-to-edit control. Renders the value inline; clicking swaps
 * in the matching editor. Text saves on Enter/blur, textarea on Ctrl+Enter,
 * select and date commit immediately. Escape cancels without saving.
 */
export const EditableField = ({
  display,
  field,
  label,
  options = [],
  placeholder = "Not set",
  studentId,
  type,
  value,
}: EditableFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [pending, startTransition] = useTransition();
  const cancelledRef = useRef(false);
  const committedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      if (type === "textarea") {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
  }, [editing, type]);

  const exit = () => setEditing(false);

  const cancel = () => {
    cancelledRef.current = true;
    exit();
  };

  const save = (next: string | number) => {
    if (String(next) === String(value ?? "")) {
      exit();
      return;
    }

    startTransition(async () => {
      const result = await updateStudent({
        field,
        studentId,
        value: next === "" ? null : next,
      });

      if (result?.error) {
        toastManager.add({ title: result.error, type: "error" });
      }
    });
    exit();
  };

  const commitDraft = () => {
    if (committedRef.current || cancelledRef.current) {
      committedRef.current = false;
      cancelledRef.current = false;
      return;
    }
    save(draft);
  };

  const handleEditorKeyDown = (event: {
    ctrlKey: boolean;
    currentTarget: { value: string };
    key: string;
    metaKey: boolean;
    preventDefault: () => void;
    shiftKey: boolean;
    stopPropagation: () => void;
  }) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      cancel();
      return;
    }
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    if (event.ctrlKey || event.metaKey || type !== "textarea") {
      event.preventDefault();
      committedRef.current = true;
      save(event.currentTarget.value);
    }
  };

  if (!editing) {
    const hasValue = value !== null && value !== "";

    return (
      <button
        aria-label={`Edit ${label ?? field}`}
        className={cn(
          "group -mx-1 inline-flex min-w-0 max-w-full items-center gap-1 rounded px-1 text-left font-medium text-sm transition-colors hover:bg-accent/60",
          !hasValue && "font-normal text-muted-foreground",
          pending && "opacity-60"
        )}
        onClick={() => {
          cancelledRef.current = false;
          committedRef.current = false;
          setDraft(value ?? "");
          setEditing(true);
        }}
        title="Click to edit"
        type="button"
      >
        <span className="truncate">
          {hasValue ? (display ?? value) : `+ ${placeholder}`}
        </span>
        <PencilIcon className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
      </button>
    );
  }

  if (type === "select") {
    const items: Record<string, string> = Object.fromEntries(
      options.map((option) => [option.value, option.label])
    );

    return (
      <Select
        items={items}
        onValueChange={(next) => {
          save(next ?? "");
        }}
        value={value ?? ""}
      >
        <SelectTrigger
          autoFocus
          className="h-8 w-auto min-w-40 max-w-full"
          disabled={pending}
          onKeyDown={handleEditorKeyDown}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === "date") {
    return <IsoDatePicker onCancel={cancel} onChange={save} value={draft} />;
  }

  if (type === "textarea") {
    return (
      <Textarea
        className="min-h-16 bg-background"
        disabled={pending}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleEditorKeyDown}
        placeholder={placeholder}
        ref={textareaRef}
        rows={3}
        value={draft}
      />
    );
  }

  return (
    <Input
      className="h-8 w-full max-w-xs bg-background sm:h-8"
      disabled={pending}
      id={`editable-${field}`}
      onBlur={commitDraft}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleEditorKeyDown}
      placeholder={placeholder}
      ref={inputRef}
      value={draft}
    />
  );
};
