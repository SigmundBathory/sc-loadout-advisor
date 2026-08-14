const syncUrl = process.env.SYNC_URL;

if (!syncUrl) {
  console.error("SYNC_URL is not configured");
  process.exit(1);
}

console.log(`Starting scheduled sync at ${new Date().toISOString()}`);

try {
  const response = await fetch(syncUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ force: true }),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Scheduled sync failed:", response.status, body);
    process.exit(1);
  }

  console.log("Scheduled sync completed:", JSON.stringify(body));
} catch (error) {
  console.error("Scheduled sync request failed:", error);
  process.exit(1);
}
