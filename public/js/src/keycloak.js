let keycloak;
import { config } from "./config.js";
export function getKeycloak() {
  if (!keycloak) {
    keycloak = new Keycloak({
      url: config("keycloakAuthUrl"),
      realm: config("keycloakRealm"),
      clientId: config("keycloakClientId"),
    });
  }
  return keycloak;
}
