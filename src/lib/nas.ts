import { createClient, WebDAVClient, AuthType } from "webdav";

let client: WebDAVClient | null = null;

export function getClient(): WebDAVClient {
  if (client) {
    return client;
  }

  if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  client = createClient(process.env.NAS_URL!, {
    username: process.env.NAS_USER!,
    password: process.env.NAS_PASS!,
    authType: AuthType.Digest,
  });

  return client;
}
