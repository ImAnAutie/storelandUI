export function config(key) {
  const configStore = {};
  // DO NOT CHANGE THIS
  // It will be automatically set when deployed via CI
  // (see github.com/OkoWsc/ParkPlanrFirebase CI config for info
  configStore.version = "{{APP_VERSION_HERE}}";
  // END OF RANTY WARNING NOTICE

  configStore.environment = "DEV";
  configStore.storelandCORE = "https://storelandapi.badgetracker.app";
  configStore.keycloakAuthUrl = "https://keycloak.dicsolve.com/auth";
  configStore.keycloakRealm = "storeland";
  configStore.keycloakClientId = "storelandUI";

  if (!key) {
    return configStore;
  }
  if (configStore[key]) {
    return configStore[key];
  } else {
    throw new Error(`Config key: ${key} unknown`);
  }
}
