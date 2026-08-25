import type { Prisma } from "@repo/database";
import {
  type Gender,
  genders,
  type StudentStatus,
  studentStatuses,
} from "@repo/schemas/enums";
import type { StudentTableFilter } from "@repo/schemas/students";

/**
 * Advanced-filter rules → Prisma conditions for the students table.
 *
 * Pure module (no server-only imports) so the mapping stays unit-testable;
 * `getStudentsForTable` consumes `foldFilterRules` and merges the result into
 * its base where clause.
 */

/** How a status rule widens the archived scope of the whole query: the base
 * where only shows active students, so filtering on ARCHIVED has to relax it. */
export type StatusScope = "all" | "archivedOnly";

const ACTIVE_ENROLLMENT = {
  status: "ACTIVE",
  archivedAt: null,
} as const;

const statuses = new Set<StudentStatus>(studentStatuses);
const genderSet = new Set<Gender>(genders);

/** Operator strings used by the students filter rules ("not.in", ...). */
const isNegated = (operator: string) =>
  operator === "neq" || operator === "not.in" || operator === "not.ilike";

const ruleValues = (rule: StudentTableFilter): string[] => {
  const { value } = rule;
  if (value == null) {
    return [];
  }
  return (Array.isArray(value) ? value : [value]).filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );
};

interface FilterCondition {
  condition?: Prisma.StudentWhereInput;
  statusScope?: StatusScope;
}

const statusFilterRule = (
  operator: string,
  values: string[]
): FilterCondition | null => {
  let included = values.filter((v): v is StudentStatus =>
    statuses.has(v as StudentStatus)
  );
  if (included.length === 0) {
    return null; // "is empty" etc. — status is a required enum.
  }
  if (isNegated(operator)) {
    included = studentStatuses.filter((s) => !included.includes(s));
    if (included.length === 0) {
      return null;
    }
  }
  const hasArchived = included.includes("ARCHIVED");
  const hasActive = included.includes("ACTIVE");
  // Both statuses selected → show everyone; archived-only → relax base.
  let statusScope: StatusScope | undefined;
  if (hasArchived && hasActive) {
    statusScope = "all";
  } else if (hasArchived) {
    statusScope = "archivedOnly";
  }
  return {
    condition: { status: { in: included } },
    statusScope,
  };
};

const classTutorFilterRule = (
  operator: string,
  values: string[],
  buildEnrollment: (ids: string[]) => Prisma.StudentWhereInput
): FilterCondition | null => {
  if (values.length === 0) {
    return null;
  }
  const enrollment = buildEnrollment(values);
  return { condition: isNegated(operator) ? { NOT: enrollment } : enrollment };
};

const genderFilterRule = (
  operator: string,
  values: string[]
): FilterCondition | null => {
  if (operator === "empty") {
    return { condition: { gender: null } };
  }
  if (operator === "not.empty") {
    return { condition: { gender: { not: null } } };
  }
  const validGenders = values.filter((v): v is Gender =>
    genderSet.has(v as Gender)
  );
  if (validGenders.length === 0) {
    return null;
  }
  return {
    condition: isNegated(operator)
      ? { gender: { notIn: validGenders } }
      : { gender: { in: validGenders } },
  };
};

const levelFilterRule = (
  operator: string,
  values: string[]
): FilterCondition | null => {
  if (operator === "empty") {
    return { condition: { level: null } };
  }
  if (operator === "not.empty") {
    return { condition: { level: { isNot: null } } };
  }
  if (values.length === 0) {
    return null;
  }
  const level = { level: { name: { in: values } } };
  return { condition: isNegated(operator) ? { NOT: level } : level };
};

const fullNameFilterRule = (
  operator: string,
  values: string[]
): FilterCondition | null => {
  const value = values[0];
  if (!value || operator === "empty" || operator === "not.empty") {
    return null; // Required field; emptiness filters don't apply.
  }
  switch (operator) {
    case "ilike":
      return {
        condition: {
          fullName: { contains: value, mode: "insensitive" as const },
        },
      };
    case "not.ilike":
      return {
        condition: {
          NOT: { fullName: { contains: value, mode: "insensitive" as const } },
        },
      };
    case "eq":
      return {
        condition: {
          fullName: { equals: value, mode: "insensitive" as const },
        },
      };
    case "neq":
      return {
        condition: {
          NOT: { fullName: { equals: value, mode: "insensitive" as const } },
        },
      };
    default:
      return null;
  }
};

/**
 * Map one filter rule to a Prisma condition on Student. Returns null for
 * operators/ids that don't apply (unknown columns, "is empty" on required
 * fields), so malformed or hostile URLs degrade to fewer filters instead of
 * errors. Status rules additionally return a scope change because archived
 * visibility lives on the base where, not inside the AND chain.
 */
const studentFilterRule = (
  rule: StudentTableFilter
): FilterCondition | null => {
  const values = ruleValues(rule);
  const { id, operator } = rule;

  switch (id) {
    case "status":
      return statusFilterRule(operator, values);
    case "class":
      return classTutorFilterRule(operator, values, (classIds) => ({
        enrollments: {
          some: { classId: { in: classIds }, ...ACTIVE_ENROLLMENT },
        },
      }));
    case "tutor":
      return classTutorFilterRule(operator, values, (teacherIds) => ({
        enrollments: {
          some: {
            class: { teacherId: { in: teacherIds } },
            ...ACTIVE_ENROLLMENT,
          },
        },
      }));
    case "gender":
      return genderFilterRule(operator, values);
    case "academicLevel":
      return levelFilterRule(operator, values);
    case "fullName":
      return fullNameFilterRule(operator, values);
    default:
      return null;
  }
};

/**
 * Fold rules into AND groups, where each group holds consecutive OR-joined
 * rules: every rule carries the operator joining it with the previous one, so
 *   A and B or C → groups [[A], [B, C]] → AND(A, OR(B, C)).
 */
export const foldFilterRules = (
  rules: StudentTableFilter[]
): { orGroups: Prisma.StudentWhereInput[][]; statusScope?: StatusScope } => {
  const orGroups: Prisma.StudentWhereInput[][] = [];
  let statusScope: StatusScope | undefined;

  for (const rule of rules) {
    const result = studentFilterRule(rule);
    if (!result) {
      continue;
    }
    if (result.statusScope) {
      statusScope = result.statusScope;
    }
    const condition = result.condition;
    if (!condition) {
      continue;
    }
    if (orGroups.length > 0 && rule.joinOperator === "or") {
      orGroups.at(-1)?.push(condition);
    } else {
      orGroups.push([condition]);
    }
  }

  return { orGroups, statusScope };
};
