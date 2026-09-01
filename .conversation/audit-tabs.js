const { chromium } = require("playwright-core");
const fs = require("fs");

const ORIGIN = "https://kamaldecorate.informatic.services";
const routes = JSON.parse(process.env.TAB_ROUTES_JSON || "[]");
const outputName = process.env.TAB_OUTPUT_NAME || "tab-audit";
const saveScreenshots = process.env.TAB_SAVE_SCREENSHOTS === "true";

function slug(value) {
  return value.replace(/^\//, "").replace(/[^a-zA-Z0-9_-]+/g, "-") || "root";
}

async function login(page) {
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

async function extractTabState(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
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
    const context = (element) => {
      let current = element;
      for (let depth = 0; depth < 4 && current; depth += 1) {
        const value = text(current);
        if (value && value.length < 300) return value;
        current = current.parentElement;
      }
      return "";
    };

    return {
      bodyText: normalize(document.body.innerText).slice(0, 40_000),
      headings: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
        .filter(visible)
        .map((element) => text(element)),
      tabs: [
        ...document.querySelectorAll('[role="tab"],fluent-tab,.mud-tab'),
      ]
        .filter(visible)
        .map((element, index) => ({
          index,
          text: text(element),
          id: element.id || "",
          selected:
            element.getAttribute("aria-selected") ||
            element.classList.contains("mud-tab-active"),
        })),
      inputs: [
        ...document.querySelectorAll(
          "input,select,textarea,fluent-select,fluent-combobox",
        ),
      ]
        .filter(visible)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          type: element.type || "",
          id: element.id || "",
          placeholder:
            element.placeholder || element.getAttribute("placeholder") || "",
          required: element.required || element.hasAttribute("required"),
          disabled: element.disabled || element.hasAttribute("disabled"),
          context: context(element),
        })),
      buttons: [
        ...document.querySelectorAll(
          'button,fluent-button,[role="button"],input[type="button"],input[type="submit"]',
        ),
      ]
        .filter(visible)
        .map((element) => ({
          text: text(element).slice(0, 240),
          id: element.id || "",
          disabled: element.disabled || element.hasAttribute("disabled"),
        })),
      tables: [
        ...document.querySelectorAll('table,[role="grid"],.fluent-table'),
      ]
        .filter(visible)
        .map((table) => ({
          headers: [
            ...table.querySelectorAll('th,[role="columnheader"]'),
          ]
            .map((element) => text(element))
            .filter(Boolean),
          rows: table.querySelectorAll('tbody tr,[role="row"]').length,
          text: text(table).slice(0, 5_000),
        })),
      links: [...document.querySelectorAll("a[href]")]
        .filter(visible)
        .map((anchor) => ({
          text: text(anchor).slice(0, 240),
          href: anchor.href,
        })),
    };
  });
}

(async () => {
  fs.mkdirSync("site-audit-auth/tab-states", { recursive: true });
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
  const results = [];
  await login(page);

  for (const route of routes) {
    await page.evaluate((nextRoute) => Blazor.navigateTo(nextRoute), route);
    await page.waitForFunction(
      (nextRoute) =>
        location.pathname.toLowerCase() === nextRoute.toLowerCase(),
      route,
      { timeout: 30_000 },
    );
    await page.waitForTimeout(4_000);

    const tabLocator = page.locator('[role="tab"],fluent-tab,.mud-tab');
    const count = await tabLocator.count();
    const routeResult = { route, tabCount: count, states: [] };

    for (let index = 0; index < count; index += 1) {
      const tabs = page.locator('[role="tab"],fluent-tab,.mud-tab');
      const tab = tabs.nth(index);
      const label = (
        (await tab.innerText().catch(() => "")) ||
        (await tab.getAttribute("aria-label")) ||
        `tab-${index + 1}`
      )
        .trim()
        .replace(/\s+/g, " ");

      await tab.click({ timeout: 15_000 });
      await page.waitForTimeout(2_500);
      const state = await extractTabState(page);
      routeResult.states.push({ index, label, ...state });
      if (saveScreenshots) {
        await page
          .screenshot({
            path: `site-audit-auth/tab-states/${slug(route)}-${String(
              index + 1,
            ).padStart(2, "0")}.png`,
            fullPage: true,
            timeout: 25_000,
          })
          .catch(() => {});
      }
      console.log(
        [
          route,
          `${index + 1}/${count}`,
          label,
          `${state.inputs.length} inputs`,
          `${state.tables.length} tables`,
        ].join("\t"),
      );
    }

    results.push(routeResult);
    fs.writeFileSync(
      `site-audit-auth/tab-states/${slug(route)}.json`,
      JSON.stringify(routeResult, null, 2),
    );
  }

  fs.writeFileSync(
    `site-audit-auth/${outputName}.json`,
    JSON.stringify(
      { capturedAt: new Date().toISOString(), routes: results },
      null,
      2,
    ),
  );
  console.log(
    "DONE",
    JSON.stringify({
      routes: results.length,
      tabs: results.reduce((sum, route) => sum + route.tabCount, 0),
    }),
  );
  await browser.close();
})().catch((error) => {
  const redacted = String(error.message)
    .replaceAll(process.env.INFOCRM_AUDIT_USERNAME || "", "[REDACTED]")
    .replaceAll(process.env.INFOCRM_AUDIT_PASSWORD || "", "[REDACTED]");
  console.error("TAB_AUDIT_ERROR", redacted);
  process.exit(1);
});