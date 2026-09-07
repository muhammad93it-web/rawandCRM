import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const assertMatches = (source, pattern, message) => {
  assert.match(source, pattern, message);
};

const functionBody = (source, name) => {
  const declaration = new RegExp(`function\\s+${name}\\s*\\([^)]*\\)[^{]*\\{`, "m");
  const match = declaration.exec(source);
  assert.ok(match, `Expected to find the ${name} function`);

  const open = source.indexOf("{", match.index);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  assert.fail(`Expected the ${name} function to have a closing brace`);
};

test("Express invoice creation persists the authenticated creator", () => {
  const source = read("artifacts/api-server/src/routes/invoices.ts");

  assertMatches(
    source,
    /const\s+createInvoice\s*=\s*async\s*\(\s*type:\s*"sale"\s*\|\s*"purchase"\s*,\s*createdByUserId:\s*number\s*,/,
    "createInvoice must accept a creator user ID independently from invoice request data",
  );
  assertMatches(
    source,
    /\.insert\s*\(\s*invoicesTable\s*\)\s*\.values\s*\(\s*\{[\s\S]*?\bcreatedByUserId\s*,[\s\S]*?\}\s*\)/,
    "the invoicesTable insert must persist createdByUserId",
  );

  for (const [route, type] of [["sales", "sale"], ["purchases", "purchase"]]) {
    assertMatches(
      source,
      new RegExp(
        `router\\.post\\s*\\(\\s*["']/${route}["'][\\s\\S]*?createInvoice\\s*\\(\\s*["']${type}["']\\s*,\\s*res\\.locals\\.user\\.id\\s*,\\s*parsed\\.data\\s*\\)`,
      ),
      `POST /${route} must pass res.locals.user.id to createInvoice`,
    );
  }
});

test("Express invoice reports resolve creators and employees from persisted relations", () => {
  const source = read("artifacts/api-server/src/routes/reports.ts");

  assertMatches(
    source,
    /createdByUserId:\s*invoicesTable\.createdByUserId[\s\S]*?createdByUserName:\s*usersTable\.displayName/,
    "invoice reports must select the persisted creator ID and user display name",
  );
  assertMatches(
    source,
    /\.leftJoin\s*\(\s*usersTable\s*,\s*eq\s*\(\s*invoicesTable\.createdByUserId\s*,\s*usersTable\.id\s*\)\s*\)/,
    "invoice reports must join users through invoices.createdByUserId",
  );
  assertMatches(
    source,
    /creatorIds\s*=\s*invoices\.flatMap[\s\S]*?db\.select\s*\(\s*\{[\s\S]*?userId:\s*employeesTable\.userId[\s\S]*?\}\s*\)\.from\s*\(\s*employeesTable\s*\)[\s\S]*?inArray\s*\(\s*employeesTable\.userId\s*,\s*creatorIds\s*\)/,
    "invoice reports must load employees by their persisted userId links",
  );
  assertMatches(
    source,
    /employeeByUser\.get\s*\(\s*invoice\.createdByUserId\s*\)\?\.id[\s\S]*?employeeByUser\.get\s*\(\s*invoice\.createdByUserId\s*\)\?\.name/,
    "invoice report employee fields must be resolved from the creator-to-employee map",
  );
});

test("PostgreSQL schema and migration define creator column, index, and foreign key", () => {
  const schema = read("lib/db/src/schema/invoices.ts");
  const migration = read("lib/db/migrations/0001_add_invoice_creator.sql");

  assertMatches(
    schema,
    /createdByUserId:\s*integer\s*\(\s*["']created_by_user_id["']\s*\)\.references\s*\(\s*\(\)\s*=>\s*usersTable\.id\s*\)/,
    "Drizzle invoices schema must define created_by_user_id as a users foreign key",
  );
  assertMatches(
    schema,
    /index\s*\(\s*["']invoices_created_by_user_idx["']\s*\)\.on\s*\(\s*table\.createdByUserId\s*\)/,
    "Drizzle invoices schema must index createdByUserId",
  );

  assertMatches(
    migration,
    /ALTER\s+TABLE\s+invoices\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+created_by_user_id\s+integer\s*;/i,
    "PostgreSQL migration must add the invoice creator column idempotently",
  );
  assertMatches(
    migration,
    /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+invoices_created_by_user_idx\s+ON\s+invoices\s*\(\s*created_by_user_id\s*\)/i,
    "PostgreSQL migration must create the creator index idempotently",
  );
  assertMatches(
    migration,
    /FOREIGN\s+KEY\s*\(\s*created_by_user_id\s*\)\s+REFERENCES\s+users\s*\(\s*id\s*\)\s+ON\s+DELETE\s+SET\s+NULL/i,
    "PostgreSQL migration must link invoice creators to users with ON DELETE SET NULL",
  );
});

test("cPanel invoice creation trusts only the authenticated actor", () => {
  const source = read("deploy/cpanel/public/api/index.php");
  const body = functionBody(source, "create_invoice");

  assertMatches(
    body,
    /\$actor\s*=\s*auth_(?:require|session_user)\s*\(\s*\)\s*;/,
    "create_invoice must obtain its actor from auth_require() or auth_session_user()",
  );
  assertMatches(
    body,
    /\$createdByUserId\s*=\s*\(int\)\s*\$actor\s*\[\s*["']id["']\s*\]\s*;/,
    "create_invoice must derive createdByUserId from the authenticated actor ID",
  );
  assertMatches(
    body,
    /INSERT\s+INTO\s+invoices[\s\S]*?\bcreated_by_user_id\b[\s\S]*?:created_by_user_id/i,
    "the cPanel invoice INSERT must include a created_by_user_id placeholder",
  );
  assertMatches(
    body,
    /["']created_by_user_id["']\s*=>\s*\$createdByUserId/,
    "the created_by_user_id placeholder must bind the authenticated actor ID",
  );
  assert.doesNotMatch(
    body,
    /\$(?:body|_POST|_GET|_REQUEST)\s*\[[^\]]*(?:createdByUserId|created_by_user_id)[^\]]*\]/i,
    "create_invoice must never accept creator attribution from request input",
  );
  assertMatches(
    body,
    /generic_report_has_column\s*\(\s*\$pdo\s*,\s*["']invoices["']\s*,\s*["']created_by_user_id["']\s*\)/,
    "create_invoice must guard writes when the invoice creator migration is absent",
  );
  assertMatches(
    body,
    /database\/030_invoice_creator\.sql[\s\S]*?503[\s\S]*?["']migration_required["']/,
    "the schema guard must return an actionable migration_required response",
  );
});

test("cPanel deployment docs list migrations in order and explain safe upgrades", () => {
  const orderedMigrations = [
    "001_core.sql",
    "002_full_domain.sql",
    "003_security.sql",
    "010_shell.sql",
    "020_lookups.sql",
    "030_backups.sql",
    "030_invoice_creator.sql",
  ];

  for (const path of ["deploy/cpanel/README.md", "deploy/cpanel/package/README.md"]) {
    const contents = read(path);
    let previousIndex = -1;
    for (const migration of orderedMigrations) {
      const index = contents.indexOf(migration);
      assert.ok(index > previousIndex, `${path} must list ${migration} in ascending order`);
      previousIndex = index;
    }
    assertMatches(
      contents,
      /030_invoice_creator\.sql[\s\S]*?before[\s\S]*?(?:uploading|replacing)[\s\S]*?updated API/i,
      `${path} must require migration 030 before upgrading the API`,
    );
    assertMatches(
      contents,
      /migration_required/,
      `${path} must document the migration_required response`,
    );
  }

  const uploadLayout = read("deploy/cpanel/package/UPLOAD_LAYOUT.txt");
  assertMatches(
    uploadLayout,
    /every database\/\*\.sql[\s\S]*?ascending filename order/i,
    "UPLOAD_LAYOUT must require importing every migration in ascending order",
  );
  assertMatches(
    uploadLayout,
    /030_invoice_creator\.sql[\s\S]*?before replacing the updated API/i,
    "UPLOAD_LAYOUT must explain the safe upgrade order",
  );
});

test("cPanel reports conditionally expose persisted creator and employee fields", () => {
  const source = read("deploy/cpanel/app/generic.php");

  assertMatches(
    source,
    /\$hasCreator\s*=\s*generic_report_has_column\s*\(\s*\$pdo\s*,\s*['"]invoices['"]\s*,\s*['"]created_by_user_id['"]\s*\)\s*&&\s*generic_report_has_column\s*\(\s*\$pdo\s*,\s*['"]users['"]\s*,\s*['"]display_name['"]\s*\)/,
    "cPanel reports must detect creator schema support before using it",
  );
  assertMatches(
    source,
    /\$hasEmployee\s*=\s*\$hasCreator\s*&&\s*generic_report_has_column\s*\(\s*\$pdo\s*,\s*['"]employees['"]\s*,\s*['"]user_id['"]\s*\)/,
    "cPanel reports must conditionally detect the employee-to-user relation",
  );
  assertMatches(
    source,
    /iv\.created_by_user_id\s*,\s*cu\.display_name\s+AS\s+created_by_user_name[\s\S]*?e\.id\s+AS\s+employee_id\s*,\s*e\.name\s+AS\s+employee_name/i,
    "cPanel report rows must expose creator and employee fields",
  );
  assertMatches(
    source,
    /LEFT\s+JOIN\s+users\s+cu\s+ON\s+cu\.id\s*=\s*iv\.created_by_user_id/i,
    "cPanel reports must join creators through the persisted invoice creator ID",
  );
  assertMatches(
    source,
    /LEFT\s+JOIN\s+employees\s+e\s+ON[\s\S]*?employee\.user_id\s*=\s*cu\.id/i,
    "cPanel reports must resolve employees through their persisted user ID",
  );
  for (const field of ["created_by_user_id", "created_by_user_name", "employee_id", "employee_name"]) {
    assertMatches(
      source,
      new RegExp(`NULL\\s+AS\\s+${field}`, "i"),
      `cPanel reports must expose nullable ${field} when its optional schema is unavailable`,
    );
  }
});

test("OpenAPI InvoiceReportRow declares nullable creator and employee fields", () => {
  const source = read("lib/api-spec/openapi.yaml");
  const start = source.indexOf("    InvoiceReportRow:");
  const end = source.indexOf("\n    InvoiceReportLine:", start);
  assert.ok(start >= 0 && end > start, "Expected an InvoiceReportRow schema section");
  const schema = source.slice(start, end);

  for (const [field, type] of [
    ["createdByUserId", "number"],
    ["createdByUserName", "string"],
    ["employeeId", "number"],
    ["employeeName", "string"],
  ]) {
    assertMatches(
      schema,
      new RegExp(`^\\s+${field}:\\s*\\{[^\\n}]*type:\\s*\\[${type},\\s*["']null["']\\]`, "m"),
      `InvoiceReportRow.${field} must be nullable ${type}`,
    );
  }
});

test("cPanel source and package attribution files remain byte-for-byte identical", () => {
  for (const [sourcePath, packagePath, label] of [
    ["deploy/cpanel/public/api/index.php", "deploy/cpanel/package/public_html/api/index.php", "API"],
    ["deploy/cpanel/app/generic.php", "deploy/cpanel/package/app/generic.php", "report app"],
    ["deploy/cpanel/database/030_invoice_creator.sql", "deploy/cpanel/package/database/030_invoice_creator.sql", "migration"],
  ]) {
    assert.equal(
      read(packagePath),
      read(sourcePath),
      `cPanel ${label} package copy must match ${sourcePath}`,
    );
  }
});