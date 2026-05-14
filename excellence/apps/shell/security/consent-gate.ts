import { dialog } from 'electron';
import type { ConsentDeniedError } from '@excellence/shared-types';

interface ConsentLogEntry {
  action: string;
  detail: string;
  granted: boolean;
  timestamp: number;
}

const consentLog: ConsentLogEntry[] = [];

export class ConsentDenied extends Error implements ConsentDeniedError {
  code: 'CONSENT_DENIED' = 'CONSENT_DENIED';
  action: string;
  timestamp: number;

  constructor(action: string) {
    super(`Consent denied for ${action}.`);
    this.action = action;
    this.timestamp = Date.now();
  }
}

export const requestConsent = async (action: string, detail: string): Promise<boolean> => {
  try {
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 0,
      cancelId: 1,
      title: 'Consent Required',
      message: action,
      detail,
      noLink: true,
    });

    const granted = result.response === 0;
    consentLog.push({ action, detail, granted, timestamp: Date.now() });

    if (!granted) {
      throw new ConsentDenied(action);
    }

    return true;
  } catch (err) {
    if (err instanceof ConsentDenied) {
      throw err;
    }
    throw new Error(`Consent dialog failed: ${String(err)}`);
  }
};

export const getConsentLog = (): ConsentLogEntry[] => [...consentLog];
