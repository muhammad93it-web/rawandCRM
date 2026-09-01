const { chromium } = require("playwright-core");
const fs = require("fs");

const ORIGIN = "https://kamaldecorate.informatic.services";
const routes = JSON.parse(process.env.AUDIT_ROUTES_JSON || "[]");
const outputName = process.env.AUDIT_OUTPUT_NAME || "batch";
const screenshotRoutes = new Set(
  JSON.parse(process.env.AUDIT_SCREENSHOT_ROUTES_JSON || "[]"),
);

function slug(route) {
  return route.replace(/^\//, "").replace(/[^a-zA-Z0-9_-]+/g, "-") || "root";
}

async function login(page) {
  if (
    !process.env.INFOCRM_AUDIT_USERNAME ||
    !process.env.INFOCRM_AUDIT_PASSWORD
  ) {
    throw new Error("Secure credentials unavailable");
  }

  await page.goto(`${ORIGIN}/`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(4_500);
  const inputs = page.locator("input.mud-input-slot:visible");
  await inputs.nth(0).waitFor({ state: "visible", timeout: 45_000 });
  await inputs.nth(1).waitFor({ state: "visible", timeout: 45_000 });
  await inputs.nth(0).evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, process.env.INFOCRM_AUDIT_USERNAME);
  await inputs.nth(1).evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, process.env.INFOCRM_AUDIT_PASSWORD);
  await page.locator('fluent-button[type="submit"]').click();
  await page.waitForURL("**/home", { timeout: 45_000 }).catch(() => {});

  for (let i = 0; i < 20; i += 1) {
    await page.waitForTimeout(1_000);
    if ((await page.locator("body").innerText()).trim().length > 100) break;
  }
  await page.waitForTimeout(10_000);
}

async function extract(page) {
  return page.evaluate(() => {
    const isVisible = (element) => {
      const styles = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        styles.display !== "none" &&
        styles.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const normalize = (value) => (value || "").trim().replace(/\s+/g, " ");
    const text = (element) =>
      normalize(
        element.innerText ||
          element.textContent ||
          element.getAttribute("aria-label") ||
          element.title ||
          "",
      );
    const controlContext = (element) => {
      let current = element;
      for (let depth = 0; depth < 4 && current; depth += 1) {
        const value = text(current);
        if (value && value.length < 300) return value;
        current = current.parentElement;
      }
      return "";
    };

    return {
      finalUrl: location.href,
      title: document.title,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      bodyText: normalize(document.body.innerText).slice(0, 50_000),
      bodyTextLength: normalize(document.body.innerText).length,
      headings: [
        ...document.querySelectorAll("h1,h2,h3,h4,h5,h6"),
      ]
        .filter(isVisible)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          text: text(element),
        })),
      links: [...document.querySelectorAll("a[href]")]
        .filter(isVisible)
        .map((anchor) => ({
          text: text(anchor).slice(0, 240),
          href: anchor.href,
          classes: String(anchor.className || "").slice(0, 180),
        })),
      buttons: [
        ...document.querySelectorAll(
          'button,fluent-button,[role="button"],input[type="button"],input[type="submit"]',
        ),
      ]
        .filter(isVisible)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          text: text(element).slice(0, 240),
          id: element.id || "",
          classes: String(element.className || "").slice(0, 180),
          type: element.getAttribute("type") || "",
          title: element.title || "",
          aria: element.getAttribute("aria-label") || "",
          disabled: element.disabled || element.hasAttribute("disabled"),
        })),
      tooltips: [
        ...document.querySelectorAll(
          'fluent-tooltip,[role="tooltip"],.mud-tooltip-root',
        ),
      ]
        .map((element) => ({
          anchor: element.getAttribute("anchor") || "",
          text: text(element).slice(0, 240),
        }))
        .filter((item) => item.text),
      inputs: [
        ...document.querySelectorAll(
          "input,select,textarea,fluent-select,fluent-combobox",
        ),
      ]
        .filter(isVisible)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          type: element.type || "",
          name: element.name || "",
          id: element.id || "",
          placeholder:
            element.placeholder || element.getAttribute("placeholder") || "",
          aria: element.getAttribute("aria-label") || "",
          required: element.required || element.hasAttribute("required"),
          disabled: element.disabled || element.hasAttribute("disabled"),
          context: controlContext(element),
        })),
      tables: [
        ...document.querySelectorAll('table,[role="grid"],.fluent-table'),
      ]
        .filter(isVisible)
        .map((table, index) => ({
          index,
          tag: table.tagName.toLowerCase(),
          classes: String(table.className || "").slice(0, 180),
          headers: [
            ...table.querySelectorAll('th,[role="columnheader"]'),
          ]
            .map((element) => text(element))
            .filter(Boolean),
          rows: table.querySelectorAll('tbody tr,[role="row"]').length,
          text: text(table).slice(0, 6_000),
        })),
      tabs: [
        ...document.querySelectorAll('[role="tab"],fluent-tab,.mud-tab'),
      ]
        .filter(isVisible)
        .map((element) => ({
          text: text(element),
          id: element.id || "",
          selected: element.getAttribute("aria-selected"),
        })),
      dialogs: [
        ...document.querySelectorAll(
          '[role="dialog"],fluent-dialog,.mud-dialog',
        ),
      ]
        .filter(isVisible)
        .map((element) => ({ text: text(element).slice(0, 3_000) })),
      customTags: [
        ...new Set(
          [...document.querySelectorAll("*")]
            .map((element) => element.tagName.toLowerCase())
            .filter((tag) => tag.includes("-")),
        ),
      ].sort(),
      dimensions: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        viewport: [innerWidth, innerHeight],
      },
    };
  });
}

(async () => {
  fs.mkdirSync("site-audit-auth/deep-pages", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  const page = await context.newPage();
  const issues = [];
  page.on("pageerror", (error) =>
    issues.push({
      route: new URL(page.url()).pathname,
      type: "pageerror",
      text: error.message.slice(0, 600),
    }),
  );
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      issues.push({
        route: new URL(page.url()).pathname,
        type: message.type(),
        text: message.text().slice(0, 600),
      });
    }
  });

  await login(page);
  const results = [];

  for (const route of routes) {
    const started = Date.now();
    let navError = null;
    try {
      await page.evaluate((nextRoute) => Blazor.navigateTo(nextRoute), route);
      await page.waitForFunction(
        (nextRoute) =>
          location.pathname.toLowerCase() === nextRoute.toLowerCase(),
        route,
        { timeout: 15_000 },
      );
      await page.waitForTimeout(4_000);
    } catch (error) {
      navError = error.message;
    }

    const data = await extract(page);
    const record = {
      route,
      elapsedMs: Date.now() - started,
      navError,
      ...data,
    };
    results.push(record);
    fs.writeFileSync(
      `site-audit-auth/deep-pages/${slug(route)}.json`,
      JSON.stringify(record, null, 2),
    );

    if (screenshotRoutes.has(route)) {
      try {
        await page.screenshot({
          path: `site-audit-auth/deep-pages/${slug(route)}.png`,
          fullPage: true,
          timeout: 25_000,
        });
      } catch (error) {
        record.screenshotError = error.message;
      }
    }

    console.log(
      [
        route,
        `${record.elapsedMs}ms`,
        `${record.bodyTextLength} chars`,
        `${record.inputs.length} inputs`,
        `${record.tables.length} tables`,
        `${record.buttons.length} buttons`,
        `${record.tabs.length} tabs`,
      ].join("\t"),
    );
  }

  fs.writeFileSync(
    `site-audit-auth/${outputName}.json`,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        origin: ORIGIN,
        routes: results,
        issues,
      },
      null,
      2,
    ),
  );
  console.log(
    "DONE",
    JSON.stringify({
      routes: results.length,
      errors: results
        .filter((record) => record.navError)
        .map((record) => [record.route, record.navError]),
      blank: results
        .filter((record) => !record.bodyTextLength)
        .map((record) => record.route),
      issues: issues.length,
    }),
  );
  await browser.close();
})().catch((error) => {
  const redacted = String(error.message)
    .replaceAll(process.env.INFOCRM_AUDIT_USERNAME || "", "[REDACTED]")
    .replaceAll(process.env.INFOCRM_AUDIT_PASSWORD || "", "[REDACTED]");
  console.error("DEEP_AUDIT_ERROR", redacted);
  process.exit(1);
});