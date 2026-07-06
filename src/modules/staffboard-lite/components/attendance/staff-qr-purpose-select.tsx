import { FormField } from "@/components/ui/form-primitives";
import type { StaffQrPurposeOption } from "./staff-qr-display-state";
import { STAFF_QR_PURPOSE_OPTIONS } from "./staff-qr-display-state";

type StaffQrPurposeSelectProps = {
  value: StaffQrPurposeOption;
  onChange: (value: StaffQrPurposeOption) => void;
  disabled?: boolean;
};

export function StaffQrPurposeSelect({ value, onChange, disabled }: StaffQrPurposeSelectProps) {
  return (
    <FormField
      id="staff-qr-purpose"
      label="QR Purpose"
      required
      helpText="Choose Check-in when staff arrive and Check-out when staff leave."
    >
      <select
        id="staff-qr-purpose"
        value={value}
        onChange={(event) => onChange(event.target.value as StaffQrPurposeOption)}
        disabled={disabled}
        className="min-h-11 w-full"
      >
        {STAFF_QR_PURPOSE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
