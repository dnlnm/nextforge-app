"use client";

import { formatMediumDate, parseCalendarDate } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import { CardContent } from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import { DatePicker } from "@repo/design-system/components/ui/date-picker";
import { Input } from "@repo/design-system/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@repo/design-system/components/ui/input-group";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { formatMoney as formatMoneyShared, parseMoneyToSen } from "@repo/money";
import type { PaymentMethod } from "@repo/schemas/enums";
import { optimizeImageFile, uploadToR2 } from "@repo/storage/client";
import {
  ArrowLeftRightIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  CircleCheckIcon,
  Clock3Icon,
  CreditCardIcon,
  EllipsisIcon,
  LandmarkIcon,
  LoaderCircleIcon,
  PaperclipIcon,
  QrCodeIcon,
  SearchIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { recordPayment, searchStudentsForPayment } from "../actions";
import { METHOD_LABELS, METHOD_REF_LABELS } from "../payments-labels";

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 3;

const methodCards: Array<{
  icon: typeof BanknoteIcon;
  method: PaymentMethod;
}> = [
  { icon: BanknoteIcon, method: "CASH" },
  { icon: LandmarkIcon, method: "BANK_TRANSFER" },
  { icon: QrCodeIcon, method: "DUITNOW" },
  { icon: ArrowLeftRightIcon, method: "FPX" },
  { icon: CreditCardIcon, method: "CARD" },
  { icon: EllipsisIcon, method: "OTHER" },
];

interface StudentOption {
  fullName: string;
  guardian: { fullName: string; phone: string | null } | null;
  id: string;
  invoice: {
    billingMonth: string;
    id: string;
    invoiceNumber: string;
    outstandingSen: number;
  };
  level: string | null;
}

interface ReceiptFile {
  key: string;
  name: string;
  size: number;
  type: string;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SuccessScreen = ({
  paymentId,
  receiptNumber,
}: {
  paymentId: string;
  receiptNumber: string;
}) => (
  <section className="mx-auto grid max-w-md gap-6 py-16 text-center">
    <CheckCircle2Icon className="mx-auto size-12 text-primary" />
    <div>
      <h1 className="font-semibold text-2xl tracking-tight">
        Payment recorded
      </h1>
      <p className="mt-1 text-muted-foreground text-sm">
        Receipt {receiptNumber} was saved and applied to the invoice.
      </p>
    </div>
    <div className="flex justify-center gap-2">
      <Button render={<Link href={`/payments/${paymentId}`} />}>
        View receipt
      </Button>
      <Button render={<Link href="/payments" />} variant="outline">
        Back to payments
      </Button>
    </div>
  </section>
);

const StudentPicker = ({
  currency,
  onClear,
  onSelect,
  student,
}: {
  currency: string;
  onClear: () => void;
  onSelect: (student: StudentOption) => void;
  student: StudentOption | null;
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentOption[]>([]);
  const [searching, setSearching] = useState(false);
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    const timer = setTimeout(() => {
      searchStudentsForPayment(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (student) {
    return (
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="font-medium">{student.fullName}</p>
          <p className="text-muted-foreground text-sm">
            {[student.level, student.guardian?.fullName]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        <Button onClick={onClear} size="sm" type="button" variant="outline">
          Change
        </Button>
      </div>
    );
  }

  const showResults = query.trim().length >= 2;

  return (
    <div className="grid gap-2">
      <Label>Search student or parent *</Label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, parent name, or invoice reference…"
          type="search"
          value={query}
        />
      </div>
      {showResults ? (
        <div className="grid gap-2">
          {searching ? (
            <p className="flex items-center gap-2 text-muted-foreground text-sm">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Searching…
            </p>
          ) : null}
          {!searching && results.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No students with an open invoice found.
            </p>
          ) : null}
          {searching
            ? null
            : results.map((result) => (
                <button
                  className="grid gap-0.5 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
                  key={result.id}
                  onClick={() => onSelect(result)}
                  type="button"
                >
                  <span className="font-medium">{result.fullName}</span>
                  <span className="text-muted-foreground text-sm">
                    {result.invoice.invoiceNumber} ·{" "}
                    {formatMoney(result.invoice.outstandingSen)} outstanding
                  </span>
                </button>
              ))}
        </div>
      ) : null}
    </div>
  );
};

const MethodSection = ({
  amount,
  currency,
  onAmountChange,
  onChange,
  student,
  today,
  value,
}: {
  amount: string;
  currency: string;
  onAmountChange: (amount: string) => void;
  onChange: (method: PaymentMethod) => void;
  student: StudentOption | null;
  today: string;
  value: PaymentMethod;
}) => {
  const selectedRef = METHOD_REF_LABELS[value];
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });

  return (
    <CardShell>
      <CardContent className="grid gap-5 p-4 sm:p-5">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
          Payment details
        </p>
        <fieldset className="grid gap-2">
          <legend className="font-medium text-sm">Payment method *</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {methodCards.map(({ icon: Icon, method }) => (
              <label className="cursor-pointer" key={method}>
                <input
                  checked={value === method}
                  className="peer sr-only"
                  name="method"
                  onChange={() => onChange(method)}
                  type="radio"
                  value={method}
                />
                <div className="grid min-h-14 place-items-center content-center gap-1 rounded-lg border border-input bg-card px-1.5 py-2 text-center transition-colors hover:bg-accent/50 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:shadow-xs peer-checked:[&_svg]:text-primary-foreground">
                  <Icon className="mx-auto size-4.5 text-muted-foreground" />
                  <span className="font-medium text-[11px] leading-tight">
                    {METHOD_LABELS[method]}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </fieldset>
        {selectedRef?.showRef ? (
          <div className="grid gap-2">
            <Label htmlFor="reference">{selectedRef.label} *</Label>
            <Input
              id="reference"
              name="reference"
              placeholder={selectedRef.placeholder}
              required
            />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (RM) *</Label>
            <InputGroup>
              <InputGroupInput
                id="amount"
                inputMode="decimal"
                min="0.01"
                name="amount"
                onChange={(event) => onAmountChange(event.target.value)}
                placeholder="0.00"
                required
                step="0.01"
                type="number"
                value={amount}
              />
              <InputGroupAddon>
                <InputGroupText>RM</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <p className="text-muted-foreground text-xs">
              {student
                ? `${student.invoice.invoiceNumber} · ${formatMoney(student.invoice.outstandingSen)} outstanding`
                : "Enter exact amount received"}
            </p>
          </div>
          <div className="grid content-start gap-2">
            <Label>Payment date *</Label>
            <DatePicker defaultValue={today} maxDate={today} name="paidAt" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="e.g. Partial payment for August fees, balance to be collected next week"
            rows={3}
          />
          <p className="text-muted-foreground text-xs">
            Internal notes — not shown to parents
          </p>
        </div>
      </CardContent>
    </CardShell>
  );
};

const ReceiptUploader = ({
  files,
  onAdd,
  onRemove,
}: {
  files: ReceiptFile[];
  onAdd: (file: ReceiptFile) => void;
  onRemove: (key: string) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const prepareReceiptFile = async (file: File): Promise<ReceiptFile> => {
    if (file.size > MAX_RECEIPT_BYTES) {
      throw new Error(`${file.name} exceeds the 10 MB limit.`);
    }

    const processed =
      file.type === "application/pdf"
        ? file
        : await optimizeImageFile(file, {
            maxSizeMB: 6,
            maxWidthOrHeight: 2048,
          });

    if (processed.size > MAX_RECEIPT_BYTES) {
      throw new Error(`${file.name} exceeds the 10 MB limit.`);
    }

    const { key } = await uploadToR2(processed, "/api/uploads/payment-receipt");

    return { key, name: file.name, size: processed.size, type: processed.type };
  };

  const addFiles = async (list: FileList | null) => {
    if (!list) {
      return;
    }

    if (files.length + list.length > MAX_ATTACHMENTS) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      return;
    }

    setError(null);

    for (const file of Array.from(list)) {
      try {
        const receipt = await prepareReceiptFile(file);
        onAdd(receipt);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Failed to upload a file."
        );
      }
    }
  };

  const onFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const list = event.target.files;
    event.target.value = "";
    await addFiles(list);
  };

  return (
    <CardShell>
      <CardContent className="grid gap-3 p-4 sm:p-5">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
          Receipt / proof of payment
        </p>
        <p className="text-muted-foreground text-xs">
          Attach screenshot, photo, or PDF — up to 3 files, 10 MB each.
          Accepted: JPG, PNG, PDF.
        </p>
        <button
          className="grid min-h-32 place-items-center content-center gap-1 rounded-xl border border-dashed bg-muted/15 p-6 text-center transition-colors hover:bg-accent/40"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={async (event) => {
            event.preventDefault();
            await addFiles(event.dataTransfer.files);
          }}
          type="button"
        >
          <span className="mb-2 grid size-9 place-items-center rounded-full bg-muted">
            <UploadCloudIcon className="size-4 text-muted-foreground" />
          </span>
          <span className="text-sm">
            Drop files here or <span className="underline">browse</span>
          </span>
          <span className="text-muted-foreground text-xs">
            JPG, PNG, PDF up to 10 MB
          </span>
        </button>
        <input
          accept="image/*,application/pdf"
          className="sr-only"
          multiple
          onChange={onFilesChange}
          ref={fileInputRef}
          type="file"
        />
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {files.length > 0 ? (
          <ul className="grid gap-2">
            {files.map((file) => (
              <li
                className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                key={file.key}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatBytes(file.size)}
                  </span>
                </span>
                <Button
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemove(file.key)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <XIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </CardShell>
  );
};

export function RecordPaymentPage({
  currency,
  today,
}: {
  currency: string;
  today: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<ReceiptFile[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CASH");
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    paymentId: string;
    receiptNumber: string;
  } | null>(null);
  const formatMoney = (amountSen: number) =>
    formatMoneyShared(amountSen, { currency });

  const selectStudent = (student: StudentOption) => {
    setSelectedStudent(student);
    setAmount((student.invoice.outstandingSen / 100).toFixed(2));
    setError(null);
  };

  const removeFile = (key: string) => {
    setFiles((previous) => previous.filter((file) => file.key !== key));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedStudent) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("invoiceId", selectedStudent.invoice.id);
      formData.set("attachments", JSON.stringify(files));
      const result = await recordPayment(formData);
      setSuccess(result);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to record the payment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <SuccessScreen
        paymentId={success.paymentId}
        receiptNumber={success.receiptNumber}
      />
    );
  }

  const amountSen = parseMoneyToSen(amount) ?? 0;
  const paymentDate = formatMediumDate(parseCalendarDate(today));

  return (
    <form
      className="mx-auto grid w-full max-w-5xl gap-5 pb-6"
      onReset={() => {
        setAmount("");
        setError(null);
        setFiles([]);
        setSelectedMethod("CASH");
        setSelectedStudent(null);
      }}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Record Payment
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Log payments received outside the system — cash, transfer, DuitNow,
            FPX, card, or other methods.
          </p>
        </div>
        <Button
          className="self-start"
          render={<Link href="/payments" />}
          size="sm"
          variant="outline"
        >
          <Clock3Icon className="size-4" />
          Payment History
        </Button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_288px]">
        <div className="grid gap-4">
          <CardShell>
            <CardContent className="grid gap-3 p-4 sm:p-5">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
                Student
              </p>
              <StudentPicker
                currency={currency}
                key={selectedStudent?.id ?? "empty"}
                onClear={() => {
                  setSelectedStudent(null);
                  setAmount("");
                }}
                onSelect={selectStudent}
                student={selectedStudent}
              />
            </CardContent>
          </CardShell>
          <MethodSection
            amount={amount}
            currency={currency}
            onAmountChange={setAmount}
            onChange={setSelectedMethod}
            student={selectedStudent}
            today={today}
            value={selectedMethod}
          />
          <ReceiptUploader
            files={files}
            onAdd={(file) => setFiles((previous) => [...previous, file])}
            onRemove={removeFile}
          />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Button
              className="w-full"
              disabled={!selectedStudent || amountSen <= 0 || submitting}
              loading={submitting}
              size="lg"
              type="submit"
            >
              <CircleCheckIcon className="size-4" />
              Record Payment
            </Button>
            <Button size="lg" type="reset" variant="outline">
              Clear Form
            </Button>
          </div>
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-4">
          <CardShell>
            <CardContent className="grid gap-3 p-4">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
                Payment summary
              </p>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Student</span>
                <span className="text-right font-medium">
                  {selectedStudent?.fullName ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-right font-medium tabular-nums">
                  {amountSen > 0 ? formatMoney(amountSen) : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Method</span>
                <span className="text-right font-medium">
                  {METHOD_LABELS[selectedMethod]}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Date</span>
                <span className="text-right font-medium">{paymentDate}</span>
              </div>
            </CardContent>
          </CardShell>
          <CardShell panelClassName="border-success/20 bg-success/5">
            <CardContent className="grid gap-2 p-4 text-xs">
              <p className="font-medium text-success">Recording tips</p>
              <p className="text-muted-foreground">
                · For DuitNow and FPX, always attach a screenshot of the
                confirmation.
              </p>
              <p className="text-muted-foreground">
                · Cash payments do not require a reference — add a note if
                needed.
              </p>
              <p className="text-muted-foreground">
                · The receipt remains available from Payment History after
                recording.
              </p>
            </CardContent>
          </CardShell>
        </aside>
      </div>
    </form>
  );
}
