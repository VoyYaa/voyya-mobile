import { useCallback, useState } from 'react';
import { getSecureStoragePort } from '@voyyaa/app-runtime';
import { LOCATION_NOTICE_VERSION } from '@voyyaa/shared';

const DISCLOSURE_SEEN_KEY = 'voyya_sharing_disclosure_seen';

export interface SharingDisclosure {
  visible: boolean;
  showIfUnseen: (options?: { force?: boolean }) => Promise<void>;
  dismiss: () => void;
}

export function useSharingDisclosure(): SharingDisclosure {
  const [visible, setVisible] = useState(false);

  const showIfUnseen = useCallback(async (options?: { force?: boolean }): Promise<void> => {
    if (options?.force) {
      setVisible(true);
      return;
    }
    const seen = await getSecureStoragePort()
      .getItem(DISCLOSURE_SEEN_KEY)
      .catch(() => null);
    if (seen !== LOCATION_NOTICE_VERSION) setVisible(true);
  }, []);

  const dismiss = useCallback((): void => {
    setVisible(false);
    void getSecureStoragePort()
      .setItem(DISCLOSURE_SEEN_KEY, LOCATION_NOTICE_VERSION)
      .catch(() => undefined);
  }, []);

  return { visible, showIfUnseen, dismiss };
}
