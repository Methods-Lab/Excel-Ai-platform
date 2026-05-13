import { useEffect, useState } from 'react';
import { IpcChannel, type IpcResponse } from '@codex-excel/shared-types';
import { useIPCBridge } from './useIPCBridge';

export function useRelayStatus() {
  const { on } = useIPCBridge();
  const [status, setStatus] = useState<string>('idle');

  useEffect(() => {
    return on(IpcChannel.RELAY_STATUS, (response: IpcResponse<unknown>) => {
      if (!response.success || !response.data) return;
      const payload = response.data as { status?: string };
      if (payload.status) {
        setStatus(payload.status);
      }
    });
  }, [on]);

  return { status };
}
