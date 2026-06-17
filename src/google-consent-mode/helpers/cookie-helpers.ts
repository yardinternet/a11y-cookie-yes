declare global {
	interface Window {
		gtag: ( ...args: unknown[] ) => void;
		dataLayer: unknown[];
	}
}

type ConsentDetails = Record< string, string >;

interface ConsentChange {
	category: string;
	oldValue: string | undefined;
	newValue: string | undefined;
}

const gtag = ( ...args: unknown[] ): void => {
	window.dataLayer.push( args );
};

const parseCookies = ( cookieString: string ): ConsentDetails => {
	return cookieString
		.split( '; ' )
		.reduce< ConsentDetails >( ( acc, cookie ) => {
			const [ key, value ] = cookie.split( '=' );
			if ( key ) {
				acc[ key ] = value ?? '';
			}
			return acc;
		}, {} );
};

const parseCookieDetails = ( consentString: string ): ConsentDetails => {
	return consentString
		.split( ',' )
		.reduce< ConsentDetails >( ( acc, item ) => {
			const [ key, value ] = item
				.split( ':' )
				.map( ( part ) => part.trim() );
			if ( key ) {
				acc[ key ] = value ?? '';
			}
			return acc;
		}, {} );
};

const compareCookieYesConsentDetails = (
	oldCookieYesConsentList: ConsentDetails,
	newCookieYesConsentList: ConsentDetails
): ConsentChange[] => {
	const changes: ConsentChange[] = [];
	const allKeys = new Set( [
		...Object.keys( oldCookieYesConsentList ),
		...Object.keys( newCookieYesConsentList ),
	] );
	allKeys.forEach( ( key ) => {
		const oldValue = oldCookieYesConsentList[ key ];
		const newValue = newCookieYesConsentList[ key ];
		if ( oldValue !== newValue ) {
			changes.push( {
				category: key,
				oldValue,
				newValue,
			} );
		}
	} );
	return changes;
};

const broadcastCookieChangeEvents = () => {
	// https://stackoverflow.com/a/63952971/13165245
	let lastCookie = document.cookie;
	const expando = '_cookie';
	const nativeCookieDesc = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'cookie'
	);
	Object.defineProperty(
		Document.prototype,
		expando,
		nativeCookieDesc || {}
	);
	Object.defineProperty( Document.prototype, 'cookie', {
		enumerable: true,
		configurable: true,
		get() {
			return this[ expando ];
		},
		set( value ) {
			this[ expando ] = value;
			const cookie = this[ expando ];
			if ( cookie !== lastCookie ) {
				try {
					const detail = { oldValue: lastCookie, newValue: cookie };
					this.dispatchEvent(
						new CustomEvent( 'cookiechange', { detail } )
					);
					channel.postMessage( detail );
				} finally {
					lastCookie = cookie;
				}
			}
		},
	} );

	// Broadcast to other open browser tabs that the cookie has changed.
	const channel = new BroadcastChannel( 'cookie-channel' );
	channel.onmessage = ( e ) => {
		lastCookie = e.data.newValue;
		document.dispatchEvent(
			new CustomEvent( 'cookiechange', { detail: e.data } )
		);
	};
};

export {
	gtag,
	parseCookies,
	parseCookieDetails,
	compareCookieYesConsentDetails,
	broadcastCookieChangeEvents,
};

export type { ConsentDetails, ConsentChange };
