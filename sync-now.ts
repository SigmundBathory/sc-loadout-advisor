import { syncDataForVersion, syncGameVersions, checkVersionAndSync } from "./src/lib/db/sync.js";

async function main() {
  console.log("Syncing game versions...");
  await syncGameVersions();
  console.log("Checking version...");
  const vc = await checkVersionAndSync();
  console.log("Version:", vc.currentVersion);
  if (vc.currentVersion) {
    console.log("Syncing data...");
    await syncDataForVersion(vc.currentVersion, (step: string, p: number) => console.log(`[${p}%] ${step}`));
    console.log("Sync completed!");
  } else {
    console.log("No version found!");
  }
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
