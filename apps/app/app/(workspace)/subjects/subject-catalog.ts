import type { SubjectCategory } from "@repo/database";
import {
  BookOpenIcon,
  CalculatorIcon,
  FlaskConicalIcon,
  type LucideIcon,
  MusicIcon,
  PaletteIcon,
  PenLineIcon,
} from "lucide-react";

export const SUBJECT_CATEGORIES: ReadonlyArray<{
  readonly label: string;
  readonly value: SubjectCategory;
}> = [
  { label: "Mathematics", value: "MATHEMATICS" },
  { label: "Science", value: "SCIENCE" },
  { label: "Languages", value: "LANGUAGES" },
  { label: "Arts", value: "ARTS" },
  { label: "General", value: "GENERAL" },
];

export const SUBJECT_CATEGORY_LABELS: Record<SubjectCategory, string> = {
  ARTS: "Arts",
  GENERAL: "General",
  LANGUAGES: "Languages",
  MATHEMATICS: "Mathematics",
  SCIENCE: "Science",
};

export interface SubjectIconOption {
  readonly Icon: LucideIcon;
  readonly key: string;
  readonly label: string;
}

export const DEFAULT_SUBJECT_ICON = "book-open";

export const SUBJECT_ICONS: Record<string, SubjectIconOption> = {
  "book-open": { key: "book-open", label: "Book", Icon: BookOpenIcon },
  calculator: { key: "calculator", label: "Calculator", Icon: CalculatorIcon },
  "flask-conical": {
    key: "flask-conical",
    label: "Science lab",
    Icon: FlaskConicalIcon,
  },
  "pen-line": { key: "pen-line", label: "Writing", Icon: PenLineIcon },
  palette: { key: "palette", label: "Art", Icon: PaletteIcon },
  music: { key: "music", label: "Music", Icon: MusicIcon },
};

export const getSubjectIconOption = (key?: string | null): SubjectIconOption =>
  SUBJECT_ICONS[key ?? DEFAULT_SUBJECT_ICON] ??
  SUBJECT_ICONS[DEFAULT_SUBJECT_ICON];

const SUBJECT_CATEGORY_VALUES: ReadonlySet<string> = new Set(
  SUBJECT_CATEGORIES.map((option) => option.value)
);

const SUBJECT_ICON_KEYS: ReadonlySet<string> = new Set(
  Object.keys(SUBJECT_ICONS)
);

export const isSubjectCategoryValue = (
  value: string
): value is SubjectCategory => SUBJECT_CATEGORY_VALUES.has(value);

export const isSubjectIconKey = (value: string): boolean =>
  SUBJECT_ICON_KEYS.has(value);
