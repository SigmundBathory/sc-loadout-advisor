import { syncDataForVersion } from "../src/lib/db/sync";
import { checkVersionAndSync } from "../src/lib/db/sync";

async function main() {
  const vc = await checkVersionAndSync();
  console.log("Version:", vc.currentVersion);
  console.log("Forcing full sync...");
  await syncDataForVersion(vc.currentVersion, (step, p) => console.log(`  ${step} (${p}%)`), { force: true });
  console.log("Force sync complete");
}
main().catch(e => { console.error(e); process.exit(1); });