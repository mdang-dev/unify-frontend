export const facebookConfig = {
    appId: '737901299112236',
    version: 'v18.0',
    cookie: true,
    xfbml: true,
    domain: process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000',
};

export const facebookSDKConfig = {
    appId: facebookConfig.appId,
    cookie: facebookConfig.cookie,
    xfbml: facebookConfig.xfbml,
    version: facebookConfig.version,
};

// Facebook sharing methods
export const facebookSharing = {
    // Basic sharing using sharer.php (no app review required)
    basicShare: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,

    // Messenger sharing (requires app review)
    messengerShare: (url, appId = facebookConfig.appId) =>
        `https://www.facebook.com/dialog/send?app_id=${appId}&link=${encodeURIComponent(url)}&redirect_uri=${encodeURIComponent(window.location.origin)}`,

    // Facebook SDK sharing (recommended)
    sdkShare: (url, quote = '') => ({
        method: 'share',
        href: url,
        quote: quote,
    }),

    // Facebook SDK messenger sharing
    sdkMessengerShare: (url) => ({
        method: 'send',
        link: url,
        app_id: facebookConfig.appId,
    }),
};
