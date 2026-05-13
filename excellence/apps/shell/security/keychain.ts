import keytar from 'keytar';

const SERVICE_NAME = 'Excellence';

export const setKey = async (account: string, value: string): Promise<void> => {
	await keytar.setPassword(SERVICE_NAME, account, value);
};

export const getKey = async (account: string): Promise<string | null> => {
	return keytar.getPassword(SERVICE_NAME, account);
};

export const deleteKey = async (account: string): Promise<boolean> => {
	return keytar.deletePassword(SERVICE_NAME, account);
};
