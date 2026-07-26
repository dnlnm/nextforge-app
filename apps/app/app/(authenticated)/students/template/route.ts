const template = [
  [
    "fullName",
    "preferredName",
    "academicLevel",
    "schoolName",
    "guardianName",
    "guardianPhone",
    "guardianEmail",
  ],
  [
    "Aisyah Binti Ahmad",
    "Aisyah",
    "Form 3",
    "SMK Taman Melati",
    "Ahmad Bin Hassan",
    "0123456789",
    "ahmad@example.com",
  ],
].map((row) => row.map((cell) => `"${cell}"`).join(","));

export const GET = () =>
  new Response(template.join("\n"), {
    headers: {
      "Content-Disposition":
        'attachment; filename="tlas-students-template.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
