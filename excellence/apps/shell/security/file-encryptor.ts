import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';

const sessionKey = randomBytes(32);
const ivLength = 12;
const authTagLength = 16;

export const encryptFile = async (src: string, dest: string): Promise<void> => {
	try {
		const plaintext = await fs.readFile(src);
		const iv = randomBytes(ivLength);
		const cipher = createCipheriv('aes-256-gcm', sessionKey, iv);
		const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
		const authTag = cipher.getAuthTag();
		const payload = Buffer.concat([iv, authTag, ciphertext]);
		await fs.writeFile(dest, payload);
	} catch (err) {
		throw new Error(`encryptFile failed: ${String(err)}`);
	} finally {
		await fs.rm(src, { force: true });
	}
};

export const decryptFile = async (src: string, dest: string): Promise<void> => {
	try {
		const payload = await fs.readFile(src);
		const iv = payload.subarray(0, ivLength);
		const authTag = payload.subarray(ivLength, ivLength + authTagLength);
		const ciphertext = payload.subarray(ivLength + authTagLength);
		const decipher = createDecipheriv('aes-256-gcm', sessionKey, iv);
		decipher.setAuthTag(authTag);
		const plaintext = Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		]);
		await fs.writeFile(dest, plaintext);
	} catch (err) {
		throw new Error(`decryptFile failed: ${String(err)}`);
	} finally {
		await fs.rm(src, { force: true });
	}
};
