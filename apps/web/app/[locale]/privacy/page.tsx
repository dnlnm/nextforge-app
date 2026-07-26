import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";

interface PrivacyPageProps {
  readonly params: Promise<{ locale: string }>;
}

export const metadata: Metadata = createMetadata({
  description:
    "How TLAS.MY handles centre, student, guardian, teacher, billing, and operational data.",
  title: "Privacy Policy - TLAS.MY",
});

const content = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: July 2026",
    intro:
      "This starter privacy policy explains how TLAS.MY handles information for tuition centres using the service. It should be reviewed by legal counsel before production launch.",
    sections: [
      [
        "Information we process",
        "TLAS.MY stores centre operating data such as organization details, users, teachers, students, guardians, subjects, classes, enrolments, attendance, invoices, manual payment records, exports, and subscription metadata.",
      ],
      [
        "How the information is used",
        "We use the information to provide tuition centre administration features, authenticate users, enforce plan limits, generate reports, sync subscription status, and support the centre owner or admin.",
      ],
      [
        "Payments",
        "Stripe processes TLAS.MY SaaS subscription payments. TLAS.MY does not process tuition payments from parents in the MVP; those payments are recorded manually by centre staff.",
      ],
      [
        "Access control",
        "The MVP is for centre owners, admins, and teachers. There is no parent or student portal yet. Founder/admin access is restricted and defaults to metadata views unless operational support is explicitly required.",
      ],
      [
        "Retention and exports",
        "Centres can export CSV reports for operational records. Retention and deletion procedures should be agreed with each centre before production rollout.",
      ],
      [
        "Contact",
        "For privacy questions, contact the TLAS.MY operator through the contact page.",
      ],
    ],
  },
  ms: {
    title: "Polisi Privasi",
    updated: "Dikemas kini: Julai 2026",
    intro:
      "Polisi privasi permulaan ini menerangkan bagaimana TLAS.MY mengendalikan maklumat untuk pusat tuisyen yang menggunakan perkhidmatan ini. Ia perlu disemak oleh penasihat undang-undang sebelum pelancaran produksi.",
    sections: [
      [
        "Maklumat yang diproses",
        "TLAS.MY menyimpan data operasi pusat seperti butiran organisasi, pengguna, guru, pelajar, penjaga, subjek, kelas, enrolmen, kehadiran, invois, rekod bayaran manual, eksport dan metadata langganan.",
      ],
      [
        "Cara maklumat digunakan",
        "Maklumat digunakan untuk menyediakan ciri pentadbiran pusat tuisyen, mengesahkan pengguna, menguatkuasakan had pelan, menjana laporan, menyegerakkan status langganan dan menyokong pemilik atau admin pusat.",
      ],
      [
        "Bayaran",
        "Stripe memproses bayaran langganan SaaS TLAS.MY. TLAS.MY tidak memproses bayaran tuisyen daripada ibu bapa dalam MVP; bayaran tersebut direkod secara manual oleh staf pusat.",
      ],
      [
        "Kawalan akses",
        "MVP ini untuk pemilik pusat, admin dan guru. Portal ibu bapa atau pelajar belum tersedia. Akses founder/admin adalah terhad dan secara lalai memaparkan metadata kecuali sokongan operasi diperlukan secara jelas.",
      ],
      [
        "Penyimpanan dan eksport",
        "Pusat boleh mengeksport laporan CSV untuk rekod operasi. Prosedur penyimpanan dan pemadaman perlu dipersetujui dengan setiap pusat sebelum produksi.",
      ],
      [
        "Hubungi",
        "Untuk soalan privasi, hubungi operator TLAS.MY melalui halaman hubungi kami.",
      ],
    ],
  },
};

const PrivacyPage = async ({ params }: PrivacyPageProps) => {
  const { locale } = await params;
  const copy = locale === "ms" ? content.ms : content.en;

  return (
    <main className="container max-w-4xl py-16">
      <p className="text-muted-foreground text-sm">{copy.updated}</p>
      <h1 className="mt-3 font-semibold text-4xl tracking-tight">
        {copy.title}
      </h1>
      <p className="mt-6 text-lg text-muted-foreground leading-8">
        {copy.intro}
      </p>
      <div className="mt-10 grid gap-8">
        {copy.sections.map(([title, body]) => (
          <section className="grid gap-2" key={title}>
            <h2 className="font-semibold text-2xl">{title}</h2>
            <p className="text-muted-foreground leading-7">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
};

export default PrivacyPage;
