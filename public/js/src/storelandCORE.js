import { config } from "./config.js";
import { getKeycloak } from "./keycloak.js";
const keycloak = getKeycloak();

export async function makeStorelandRequest(url, httpMethod, body) {
  if (body) {
    body = JSON.stringify(body);
  } else {
    body = null;
  }
  console.log("Updating keycloak token");
  await keycloak.updateToken(30);
  const requestUrl = `${config("storelandCORE")}/${url}`;
  console.log(`Making: ${httpMethod} request to: ${requestUrl}`);
  const requestResult = await fetch(requestUrl, {
    method: httpMethod,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${keycloak.token}`,
    },
    body: body,
  });
  console.log("Got response");
  return await requestResult.json();
}
