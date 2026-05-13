import { useCallback } from 'react';
import { IPC_CHANNELS } from '@codex-excel/shared-types';
import { useIPCBridge } from './useIPCBridge';

export function useRelayStatus() {
  const { invoke } = useIPCBridge();

  const getRelayStatus = useCallback(
    (jobId: string) => invoke(IPC_CHANNELS.RELAY_STATUS, { jobId }),
    [invoke]
  );

  return { getRelayStatus };
}
