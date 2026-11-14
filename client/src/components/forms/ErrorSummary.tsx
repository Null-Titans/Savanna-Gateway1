import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '../../i18n';

export interface FormErrorItem {
  fieldId: string;
  message: string;
}

interface ErrorSummaryProps {
  errors: FormErrorItem[];
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({ errors }) => {
  const { t } = useI18n();
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-xl border-2 border-red-700 bg-red-50 p-4 mb-5 text-red-950"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-800 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-base font-semibold text-red-950">{t.common.errorSummaryTitle}</h3>
          <ul className="mt-2 space-y-1 text-sm list-disc ps-5">
            {errors.map((err) => (
              <li key={err.fieldId}>
                <a
                  href={`#${err.fieldId}`}
                  className="underline font-medium text-red-900 hover:text-red-950"
                >
                  {err.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
