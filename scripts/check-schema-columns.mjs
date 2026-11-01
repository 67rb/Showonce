// Out-of-band schema validation (5.2 READ-PATH + 5.7 WRITE-PAYLOAD).
// Validates SQL column lists used by the service's loaders and the
// professional request/enrollment write payloads against the mirrored drizzle
// schema (CREATE TABLE bodies + ALTER TABLE ADD COLUMN), unioned per table.
// Aggregates, qualified references (t.col) and bind placeholders are skipped —
// only plain column names are checked.
import fs from "fs";
import path from "path";

const ROOT = "services/learning/hashir/public-site";

// ---------- 1. Build table -> Set(columns) ----------
const tables = new Map();
const addCol = (table, col) => {
  if (!tables.has(table)) tables.set(table, new Set());
  tables.get(table).add(col);
};
const tableNames = new Set();
for (const f of fs.readdirSync(path.join(ROOT, "drizzle")).filter((x) => x.endsWith(".sql"))) {
  const text = fs.readFileSync(path.join(ROOT, "drizzle", f), "utf8");
  const lines = text.split("\n");
  for (const line of lines) {
    const alter = line.match(/^\s*ALTER TABLE (\w+) ADD COLUMN (\w+)/);
    if (alter) { addCol(alter[1], alter[2]); tableNames.add(alter[1]); }
  }
  // CREATE TABLE with balanced-paren body (single-line or multi-line).
  const re = /CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    const name = m[1];
    tableNames.add(name);
    let depth = 1, i = re.lastIndex;
    for (; i < text.length && depth > 0; i++) {
      const ch = text[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
    }
    const body = text.slice(re.lastIndex, i - 1);
    // Split on top-level commas (CHECK(...) constraints nest parens).
    const parts = [];
    let splitDepth = 0, buf = "";
    for (const ch of body) {
      if (ch === "(") splitDepth++;
      if (ch === ")") splitDepth--;
      if (ch === "," && splitDepth === 0) { parts.push(buf); buf = ""; continue; }
      buf += ch;
    }
    if (buf.trim()) parts.push(buf);
    for (const part of parts) {
      const t = part.trim();
      if (/^(UNIQUE|PRIMARY|FOREIGN|CHECK|CONSTRAINT)/i.test(t)) continue;
      const col = t.match(/^(\w+)\s+(TEXT|INTEGER|REAL|BLOB|NUMERIC|BOOLEAN|VARCHAR|JSON|DOUBLE|FLOAT)/i);
      if (col) addCol(name, col[1]);
    }
  }
}

// ---------- 2. Validate SQL in the service sources ----------
const clean = (c) => c.trim().replace(/\s+AS\s+\w+$/i, "");
const isPlain = (c) => /^[A-Za-z_]\w*$/.test(c);

const files = fs.readdirSync(path.join(ROOT, "src")).filter((f) => f.endsWith(".mjs"));
let checked = 0, skipped = 0;
const problems = [];
const check = (table, cols, kind, file, line) => {
  const known = tables.get(table);
  if (!known) { problems.push(`${file}:${line} ${kind}: unknown table "${table}"`); return; }
  for (const raw of cols) {
    const c = clean(raw);
    if (!isPlain(c)) { skipped++; continue; }
    if (known.has(c) || known.has(c.toLowerCase())) { checked++; continue; }
    problems.push(`${file}:${line} ${kind} ${table}: unknown column "${c}"`);
  }
};

for (const f of files) {
  const lines = fs.readFileSync(path.join(ROOT, "src", f), "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/INSERT (?:OR IGNORE )?INTO (\w+)\s*\(([^)]+)\)/g)) {
      check(m[1], m[2].split(","), "INSERT", f, i + 1);
    }
    // UPDATE t SET col=?, ... — only the assignments before WHERE/EXISTS, one item per comma at this nesting.
    const upd = line.match(/UPDATE (\w+) SET ([^;]*?)(?:WHERE|;|$)/i);
    if (upd) {
      const items = upd[2].split(",").map((x) => x.trim()).filter(Boolean);
      for (const item of items) {
        const m = item.match(/^(\w+)\s*=/);
        if (m) check(upd[1], [m[1]], "UPDATE", f, i + 1);
        else skipped++;
      }
    }
    const sel = line.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)/i);
    if (sel) {
      // Subqueries inside the SELECT list make the outer FROM ambiguous
      // (more than one FROM in the statement) — skip rather than mis-assign.
      const froms = [...line.matchAll(/\bFROM\s+(\w+)/gi)];
      if (froms.length === 1) check(sel[2], sel[1].split(","), "SELECT", f, i + 1);
      else skipped++;
    }
  });
}

console.log(`schema tables (${tableNames.size}): ${[...tableNames].sort().join(", ")}`);
console.log(`validated plain columns: ${checked} · skipped aggregates/qualified/placeholders: ${skipped}`);
if (problems.length) {
  console.log("PROBLEMS:");
  for (const p of problems) console.log(" - " + p);
  process.exit(1);
}
console.log("PASS: every plain SQL column list used by the service matches the mirrored schema.");
