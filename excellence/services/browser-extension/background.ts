// 🔲 Dev 2 implements — MV3 service worker
// Connects to relay WebSocket on startup
// Listens for open-url → opens new tab
// User clicks Capture → sends document.documentElement.outerHTML back

interface RelayMessage {
	type: 'command' | 'status' | 'html' | 'error';
	command?: 'open-url' | 'capture-html' | 'close';
	url?: string;
	html?: string;
	error?: string;
}

let socket: WebSocket | null = null;

function connectToRelay(port: number, token: string): void {
	socket = new WebSocket(`ws://localhost:${port}?token=${token}`);

	socket.addEventListener('message', (event) => {
		const message = JSON.parse(event.data as string) as RelayMessage;
		if (message.type === 'command' && message.command === 'open-url' && message.url) {
			chrome.tabs.create({ url: message.url });
		}
	});

	socket.addEventListener('close', () => {
		socket = null;
	});
}

function sendHtml(html: string): void {
	if (!socket || socket.readyState !== WebSocket.OPEN) return;
	const message: RelayMessage = { type: 'html', html };
	socket.send(JSON.stringify(message));
}

// Dev 2 wires up chrome.action.onClicked → capture active tab HTML → sendHtml()
export { connectToRelay, sendHtml };
