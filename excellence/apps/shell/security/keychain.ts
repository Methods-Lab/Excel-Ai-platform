import keytar from 'keytar';

const SERVICE_NAME = 'Excellence';

export const setKey = async (account: string, value: string): Promise<void> => {
	try {
		await keytar.setPassword(SERVICE_NAME, account, value);
	} catch (err) {
		throw new Error(`Failed to set key for ${account}: ${String(err)}`);
	}
};

export const getKey = async (account: string): Promise<string | null> => {
	try {
		return await keytar.getPassword(SERVICE_NAME, account);
	} catch (err) {
		throw new Error(`Failed to get key for ${account}: ${String(err)}`);
	}
};

export const deleteKey = async (account: string): Promise<boolean> => {
	try {
		return await keytar.deletePassword(SERVICE_NAME, account);
	} catch (err) {
		throw new Error(`Failed to delete key for ${account}: ${String(err)}`);
	}
};
