import { FormField } from "@/components/ui/form-primitives";

type StaffQrManualTokenInputProps = {
  value: string;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: string) => void;
};

export function StaffQrManualTokenInput({ value, disabled, compact = false, onChange }: StaffQrManualTokenInputProps) {
  return (
    <FormField
      id="staff-qr-token"
      label="QR token or scanned QR payload"
      required
      helpText="Fallback for denied camera permission, unsupported browsers, or desktop QA. Paste the QR token or full QR payload."
    >
      <textarea
        id="staff-qr-token"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={compact ? 3 : 5}
        autoComplete="off"
        spellCheck={false}
        placeholder="Paste the scanned QR token here"
        className={`${compact ? "min-h-28" : "min-h-36"} w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-base shadow-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 sm:text-sm`}
      />
    </FormField>
  );
}
