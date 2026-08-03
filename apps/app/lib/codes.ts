const nonAlphanumericRegex = /[^a-zA-Z0-9]/g;
const nonClassCodeRegex = /[^a-zA-Z0-9-]/g;

export const normalizeCode = (value: string) =>
  value.toUpperCase().replace(nonAlphanumericRegex, "").slice(0, 4);

export const isValidCode = (value: string) => /^[A-Z0-9]{1,4}$/.test(value);

export const normalizeClassCode = (value: string) =>
  value.toUpperCase().replace(nonClassCodeRegex, "").slice(0, 20);

export const isValidClassCode = (value: string) =>
  /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value);

export const getAcademicYearOptions = (start = new Date().getFullYear()) =>
  [start, start + 1, start + 2].map(String);

export const buildClassCode = ({
  academicYear,
  levelCode,
  subjectCode,
  suffix,
}: {
  academicYear: number | string;
  levelCode?: string;
  subjectCode?: string;
  suffix?: number;
}) => {
  const subject = subjectCode?.toUpperCase().slice(0, 4) ?? "SUB";
  const level = levelCode?.toUpperCase().slice(0, 4) ?? "LVL";
  const year = String(academicYear).padStart(4, "0").slice(-2);
  const base = `${subject}-${level}-${year}`;

  return suffix && suffix > 1 ? `${base}-${suffix}` : base;
};
