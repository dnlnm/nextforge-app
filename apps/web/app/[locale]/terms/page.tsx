import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";

interface TermsPageProps {
  readonly params: Promise<{ locale: string }>;
}

export const metadata: Metadata = createMetadata({
  description:
    "Starter terms for TLAS.MY tuition centre management subscriptions.",
  title: "Terms of Service - TLAS.MY",
});

const content = {
  en: {
    title: "Terms of Service",
    updated: "Last updated: July 2026",
    intro:
      "These starter terms describe the intended use of TLAS.MY during launch and pilot rollout. They should be reviewed by legal counsel before production launch.",
    sections: [
      [
        "Service",
        "TLAS.MY provides tuition centre management software for owners, admins, and teachers, including students, classes, attendance, invoices, manual payment records, reports, and subscription billing.",
      ],
      [
        "Subscriptions and trials",
        "Centres may start with a trial and then subscribe to Starter or Pro. Plan limits may apply to students, teachers, classes, and monthly invoices. Stripe handles TLAS.MY subscription payments.",
      ],
      [
        "Tuition payments",
        "TLAS.MY does not collect tuition payments from parents in the MVP. Centre staff are responsible for manually recording cash, transfer, DuitNow, FPX, card, or other tuition payment records accurately.",
      ],
      [
        "Centre responsibilities",
        "Centres are responsible for the accuracy of student, guardian, teacher, invoice, attendance, and payment data entered into TLAS.MY and for obtaining any required consent from their own customers or staff.",
      ],
      [
        "Availability and changes",
        "TLAS.MY may change features, limits, pricing, or integrations as the product develops. We aim to communicate material changes before they affect active centres.",
      ],
      [
        "Contact",
        "For questions about these terms, contact the TLAS.MY operator through the contact page.",
      ],
    ],
  },
  ms: {
    title: "Terma Perkhidmatan",
    updated: "Dikemas kini: Julai 2026",
    intro:
      "Terma permulaan ini menerangkan penggunaan TLAS.MY semasa pelancaran dan pilot. Ia perlu disemak oleh penasihat undang-undang sebelum pelancaran produksi.",
    sections: [
      [
        "Perkhidmatan",
        "TLAS.MY menyediakan perisian pengurusan pusat tuisyen untuk pemilik, admin dan guru, termasuk pelajar, kelas, kehadiran, invois, rekod bayaran manual, laporan dan billing langganan.",
      ],
      [
        "Langganan dan percubaan",
        "Pusat boleh bermula dengan percubaan dan kemudian melanggan Starter atau Pro. Had pelan mungkin dikenakan pada pelajar, guru, kelas dan invois bulanan. Stripe mengendalikan bayaran langganan TLAS.MY.",
      ],
      [
        "Bayaran tuisyen",
        "TLAS.MY tidak mengutip bayaran tuisyen daripada ibu bapa dalam MVP. Staf pusat bertanggungjawab merekod bayaran tunai, transfer, DuitNow, FPX, kad atau lain-lain dengan tepat.",
      ],
      [
        "Tanggungjawab pusat",
        "Pusat bertanggungjawab terhadap ketepatan data pelajar, penjaga, guru, invois, kehadiran dan bayaran yang dimasukkan ke TLAS.MY serta mendapatkan persetujuan yang diperlukan daripada pelanggan atau staf mereka.",
      ],
      [
        "Ketersediaan dan perubahan",
        "TLAS.MY mungkin mengubah ciri, had, harga atau integrasi semasa produk berkembang. Kami akan cuba memaklumkan perubahan penting sebelum ia menjejaskan pusat aktif.",
      ],
      [
        "Hubungi",
        "Untuk soalan tentang terma ini, hubungi operator TLAS.MY melalui halaman hubungi kami.",
      ],
    ],
  },
};

const TermsPage = async ({ params }: TermsPageProps) => {
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

export default TermsPage;
