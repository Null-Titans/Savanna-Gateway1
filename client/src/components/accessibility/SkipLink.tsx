import React from 'react';
import { useI18n } from '../../i18n';

export const SkipLink: React.FC<{ targetId?: string }> = ({ targetId = 'gw-main-content' }) => {
  const { t } = useI18n();
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-3 focus:rounded-lg focus:font-semibold focus:shadow-lg"
      style={{
        backgroundColor: 'var(--gw-primary)',
        color: 'var(--gw-primary-text)',
      }}
    >
      {t.common.skipToContent}
    </a>
  );
};
