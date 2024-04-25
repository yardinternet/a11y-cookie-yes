/**
 * @file Implementation of the Google Consent Mode
 * @module google-consent-mode
 * @description Tracking cookie changes, parsing cookieYes consent state, and setting google gtag consentmode.
 *
 * @requires google-consent-mode/helpers/cookie-helpers
 * @author WybeBosch
 */

import {
	gtag,
	parseCookies,
	parseCookieDetails,
	compareCookieYesConsentDetails,
	broadcastCookieChangeEvents,
} from './helpers/cookie-helpers';

export class GoogleConsentMode {
	// Based on cookieYes mapping of categories to Google Consent Mode
	// https://www.cookieyes.com/documentation/implementing-google-consent-mode-using-cookieyes/#:~:text=CookieYes%20script%20again.-,Google%20Consent%20Type,-CookieYes%20CMP%20maps
	private consentMapping: { [key: string]: string } = {
		ad_storage: 'advertisement',
		ad_user_data: 'advertisement',
		ad_personalization: 'advertisement',
		analytics_storage: 'analytics',
		functionality_storage: 'functional',
		personalization_storage: 'functional',
		security_storage: 'necessary',
	};

	constructor() {
		broadcastCookieChangeEvents();
		this.setupDefaultGtagConsent();
		this.initialPageLoad();
		this.laterCookieChange();
	}

	private setupDefaultGtagConsent() {
		window.dataLayer = window.dataLayer || [];

		gtag('consent', 'default', {
			ad_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied',
			analytics_storage: 'denied',
			functionality_storage: 'denied',
			personalization_storage: 'denied',
			security_storage: 'granted',
		});

		gtag('set', 'ads_data_redaction', true);
		gtag('set', 'url_passthrough', true);
	}

	private initialPageLoad() {
		const cookies = parseCookies(document.cookie);
		const consentCookie = cookies['cookieyes-consent'];
		if (!consentCookie) return;

		const consentDetails = parseCookieDetails(consentCookie);
		if (!consentDetails.action) return;

		const gtagConsent = this.matchCookieYesConsentToGtag(consentDetails);
		gtag('consent', 'update', gtagConsent);

		if (consentDetails.advertisement === 'yes') {
			gtag('set', 'ads_data_redaction', false);
		}
	}

	private laterCookieChange() {
		document.addEventListener('cookiechange', (event) => {
			const { oldValue, newValue } = (event as CustomEvent).detail;
			const oldConsent = parseCookies(oldValue)['cookieyes-consent'];
			const newConsent = parseCookies(newValue)['cookieyes-consent'];

			if (!oldConsent || !newConsent) return;

			const changes = compareCookieYesConsentDetails(
				parseCookieDetails(oldConsent),
				parseCookieDetails(newConsent)
			);

			if (!(changes.length > 0)) return;
			if (changes[0]['category'].match(/^(action|consent)$/)) return;

			this.updateSpecificGtagConsent(changes);
		});
	}

	private updateSpecificGtagConsent(changes: any[]) {
		changes.forEach((change) => {
			const newGtag = this.matchCookieYesConsentToGtag({ [change.category]: change.newValue });
			gtag('consent', 'update', newGtag);

			if (change.category == 'advertisement' && change.newValue == 'yes') {
				gtag('set', 'ads_data_redaction', false);
			}
		});
	}

	private matchCookieYesConsentToGtag(consentDetails: { [key: string]: string }) {
		const gtagConsent: { [key: string]: string } = {};
		Object.entries(consentDetails).forEach(([cookieYesKey, cookieYesKeyValue]) => {
			const matchedGtagKeys = Object.keys(this.consentMapping).filter(
				(gtagKey) => this.consentMapping[gtagKey] === cookieYesKey
			);

			matchedGtagKeys.forEach((gtagKey) => {
				gtagConsent[gtagKey] = cookieYesKeyValue === 'yes' ? 'granted' : 'denied';
			});
		});

		return gtagConsent;
	}
}
