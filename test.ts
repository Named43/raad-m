import { RouterOSAPI } from "node-routeros";
const client = new RouterOSAPI({ host: '127.0.0.1', user: 'admin', password: '' });
try {
  client.close().catch(() => {});
} catch (e) {
  console.log("Error:", e.message);
}
