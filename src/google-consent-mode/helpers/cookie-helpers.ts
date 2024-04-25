declare global {
	interface Window {
		gtag: any;
		dataLayer: any;
	}
}

const gtag = (...args: any[]): void => {
	window.dataLayer.push(args);
};

const parseCookies = (cookieString: string) => {
	return cookieString.split('; ').reduce((acc: any, cookie: any) => {
		const [key, value] = cookie.split('=');
		acc[key] = value;
		return acc;
	}, {});
};

const parseCookieDetails = (consentString: string) => {
	return consentString.split(',').reduce((acc: any, item: any) => {
		const [key, value] = item.split(':').map((part: any) => part.trim());
		acc[key] = value;
		return acc;
	}, {});
};

const compareCookieYesConsentDetails = (
	oldCookieYesConsentList: any,
	newCookieYesConsentList: any
) => {
	const changes: any[] = [];
	const allKeys = new Set([
		...Object.keys(oldCookieYesConsentList),
		...Object.keys(newCookieYesConsentList),
	]);
	allKeys.forEach((key) => {
		const oldValue = oldCookieYesConsentList[key];
		const newValue = newCookieYesConsentList[key];
		if (oldValue !== newValue) {
			changes.push({
				category: key,
				oldValue: oldValue,
				newValue: newValue,
			});
		}
	});
	return changes;
};

const broadcastCookieChangeEvents = () => {
	// https://stackoverflow.com/a/63952971/13165245
	let lastCookie = document.cookie;
	const expando = '_cookie';
	let nativeCookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
	Object.defineProperty(Document.prototype, expando, nativeCookieDesc || {});
	Object.defineProperty(Document.prototype, 'cookie', {
		enumerable: true,
		configurable: true,
		get() {
			return this[expando];
		},
		set(value) {
			this[expando] = value;
			let cookie = this[expando];
			if (cookie !== lastCookie) {
				try {
					let detail = { oldValue: lastCookie, newValue: cookie };
					this.dispatchEvent(new CustomEvent('cookiechange', { detail }));
					channel.postMessage(detail);
				} finally {
					lastCookie = cookie;
				}
			}
		},
	});

	// Broadcast to other open browser tabs that the cookie has changed.
	const channel = new BroadcastChannel('cookie-channel');
	channel.onmessage = (e) => {
		lastCookie = e.data.newValue;
		document.dispatchEvent(new CustomEvent('cookiechange', { detail: e.data }));
	};
};

export {
	gtag,
	parseCookies,
	parseCookieDetails,
	compareCookieYesConsentDetails,
	broadcastCookieChangeEvents,
};
