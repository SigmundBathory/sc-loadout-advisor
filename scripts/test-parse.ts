import * as cheerio from "cheerio";

async function test() {
  const res = await fetch("https://scfocus.org/ship-sale-rental-locations-history/");
  const html = await res.text();
  const $ = cheerio.load(html);

  const headings: { tag: string; text: string }[] = [];
  $("h1, h2, h3, h4, h5").each((_, h) => {
    const t = $(h).text().trim();
    if (t.toLowerCase().includes("rental") || t.toLowerCase().includes("earn") || t.toLowerCase().includes("sale") || t.toLowerCase().includes("purchase")) {
      headings.push({ tag: h.tagName, text: t });
    }
  });
  console.log("Headings:", JSON.stringify(headings, null, 2));

  $("table").each((i: number, table: any) => {
    const prevText = $(table).prevAll("h2, h3, h4").first().text().trim();
    const headers = $(table).find("th").map((_: any, th: any) => $(th).text().trim()).get();
    const rowCount = $(table).find("tr").length;
    console.log(`Table ${i}: prev="${prevText.substring(0, 60)}" headers=${JSON.stringify(headers)} rows=${rowCount}`);
  });
}

test();
