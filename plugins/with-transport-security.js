const { withAndroidManifest, withInfoPlist, AndroidConfig } = require('@expo/config-plugins');

function withAndroidTransportSecurity(config) {
  return withAndroidManifest(config, (cfg) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    mainApplication.$['android:usesCleartextTraffic'] = 'false';
    return cfg;
  });
}

function withIosTransportSecurity(config) {
  return withInfoPlist(config, (cfg) => {
    const existing = cfg.modResults.NSAppTransportSecurity || {};
    cfg.modResults.NSAppTransportSecurity = {
      ...existing,
      NSAllowsArbitraryLoads: false,
      NSAllowsArbitraryLoadsInWebContent: false,
    };
    return cfg;
  });
}

module.exports = function withTransportSecurity(config) {
  config = withAndroidTransportSecurity(config);
  config = withIosTransportSecurity(config);
  return config;
};
