// Normalización de nombres de naves para matchear fuentes distintas
// (star-citizen.wiki vs scfocus.org vs Wikelo).

const MANUFACTURER_PREFIXES = [
  "origin", "rsi", "misc", "aegis", "anvil", "crusader", "drake", "argo",
  "krig", "mirai", "cnou", "tumbril", "greycat", "esperia", "vanduul",
  "banu", "gatac", "xian", "aopoa", "roberts space industries", "consolidated",
];

const VARIANT_SUFFIX_RE =
  /( wikelo[\s\S]*| teach's special| pyam exec| executive edition| collector[\s\S]*| best in show edition| citizencon[\s\S]*| 2949 best in show edition)$/i;

export function normalizeShipName(name: string): string {
  let n = String(name || "").toLowerCase().trim();

  n = n.replace(VARIANT_SUFFIX_RE, "");

  for (const prefix of MANUFACTURER_PREFIXES) {
    if (n.startsWith(prefix + " ")) {
      n = n.slice(prefix.length + 1);
      break;
    }
  }

  // Normalize Mk notation
  n = n.replace(/\bmk\s*(i{1,3}|iv|v|1|2)\b/g, (m) => m.toLowerCase());

  // Known aliases scfocus -> wiki
  const aliases: Array<[RegExp, string]> = [
    [/^c2 starlifter$/, "c2 hercules starlifter"],
    [/^a2 starlifter$/, "a2 hercules starlifter"],
    [/^m2 starlifter$/, "m2 hercules starlifter"],
    [/^starlifter$/, "hercules starlifter"],
    [/^star fighter inferno$/, "ares star fighter inferno"],
    [/^star fighter ion$/, "ares star fighter ion"],
    [/^star fighter /, "ares star fighter "],
    [/^pisces c8 rescue$/, "c8r pisces rescue"],
    [/^pisces rescue c8r$/, "c8r pisces rescue"],
    [/^pisces c8r$/, "c8r pisces rescue"],
    [/^pisces expedition c8x$/, "c8x pisces expedition"],
    [/^pisces c8x$/, "c8x pisces expedition"],
    [/^pisces c8$/, "c8 pisces"],
    [/^aurora es mk 1$/, "aurora mk i es"],
    [/^aurora lx mk 1$/, "aurora mk i lx"],
    [/^aurora ln mk 1$/, "aurora mk i ln"],
    [/^aurora mr mk 1$/, "aurora mk i mr"],
    [/^aurora es$/, "aurora mk i es"],
    [/^aurora cl$/, "aurora mk i cl"],
    [/^aurora lx$/, "aurora mk i lx"],
    [/^aurora ln$/, "aurora mk i ln"],
    [/^aurora mr$/, "aurora mk i mr"],
    [/^hornet f7c mk 1$/, "f7c hornet mk i"],
    [/^hornet f7c mk 2$/, "f7c hornet mk ii"],
    [/^hornet f7c-r tracker mk 2$/, "f7c-r hornet tracker mk ii"],
    [/^hornet f7c-s ghost mk 1$/, "f7c-s hornet ghost mk i"],
    [/^hornet f7c-s ghost mk 2$/, "f7c-s hornet ghost mk ii"],
    [/^hornet tracker f7c-r mk 1$/, "f7c-r hornet tracker mk i"],
    [/^hornet wildfire f7c mk 1$/, "f7c hornet wildfire mk i"],
    [/^super hornet f7c-m mk 1$/, "f7c-m super hornet mk i"],
    [/^san'tok\.yai$/, "san'tok.yāi"],
    [/^san'tok\.yai/, "san'tok.yāi"],
    [/^idris p$/, "idris-p"],
    [/^idris m$/, "idris-m"],
    [/^f8c hornet mk 2$/, "f8c lightning"],
    [/^f8c lightning military$/, "f8c lightning"],
    [/^f8c lightning stealth$/, "f8c lightning"],
    [/^zeus cl$/, "zeus mk ii cl"],
    [/^zeus ex$/, "zeus mk ii es"],
    [/^zeus es$/, "zeus mk ii es"],
    [/^taurus$/, "constellation taurus"],
    [/^cyclone$/, "tumbril cyclone"],
    [/^l-21 wolf miliatary$/, "l-21 wolf"],
    [/^l-21 wolf military$/, "l-21 wolf"],
    [/^l-21 wolf stealth$/, "l-21 wolf"],
    [/^guadrian mx$/, "mirai guardian mx"],
    [/^guardian mx$/, "mirai guardian mx"],
    [/^golem teach's special$/, "golem"],
    [/^fortune teach's special$/, "misc fortune"],
    [/^mole teach's special$/, "mole"],
    [/^vulture teach's special$/, "vulture"],
    [/^nomad teach's special$/, "nomad"],
    [/^reclaimer teach's special$/, "reclaimer"],
    [/^starlancer max$/, "misc starlancer max"],
    [/^starlancer tac$/, "misc starlancer tac"],
    [/^freelancer$/, "misc freelancer"],
    [/^freelancer dur$/, "misc freelancer dur"],
    [/^freelancer max$/, "misc freelancer max"],
    [/^freelancer mis$/, "misc freelancer mis"],
    [/^prospector$/, "misc prospector"],
    [/^hull a$/, "misc hull a"],
    [/^hull c$/, "misc hull c"],
    [/^reliant kore$/, "misc reliant kore"],
    [/^reliant mako$/, "misc reliant mako"],
    [/^reliant sen$/, "misc reliant sen"],
    [/^reliant tana$/, "misc reliant tana"],
    [/^starfarer$/, "misc starfarer"],
    [/^starfarer gemini$/, "misc starfarer gemini"],
    [/^m50$/, "m50 interceptor"],
    [/^85x$/, "85x limited"],
    [/^100i$/, "origin 100i"],
    [/^600i$/, "origin 600i"],
    [/^atls itki$/, "argo atls ikti"],
    [/^atls$/, "atls geo"],
    [/^stv$/, "stv"],
  ];

  for (const [re, rep] of aliases) {
    n = n.replace(re, rep);
  }

  return n.replace(/\s+/g, " ").trim();
}
