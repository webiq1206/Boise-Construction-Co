import type { Page, Request, Route } from "@playwright/test";

type Json = Record<string, unknown>;

const json = (route: Route, body: Json, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

function requestJson(request: Request): Json {
  try {
    return request.postDataJSON() as Json;
  } catch {
    return {};
  }
}

/**
 * Network boundary for browser tests which handle customer contact details.
 *
 * Same-origin page assets are allowed through, but every API request is handled
 * in the browser process and every cross-origin request (including analytics)
 * is aborted. Thus a developer's populated .env cannot turn an e2e run into a
 * provider call or a durable customer write.
 */
export async function installSafeBrowserHarness(
  page: Page,
  baseURL: string,
  fixtures: {
    re10Analyze?: Json;
  } = {},
) {
  const origin = new URL(baseURL).origin;

  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.protocol === "data:" || url.protocol === "blob:") {
      return route.continue();
    }
    if (url.origin !== origin) {
      return route.abort("blockedbyclient");
    }
    if (!url.pathname.startsWith("/api/")) {
      if (request.method() === "GET" || request.method() === "HEAD") {
        return route.continue();
      }
      return json(route, {
        error: "blocked_by_e2e_harness",
        message: `The e2e harness blocked an unregistered same-origin write to ${url.pathname}`,
      }, 418);
    }

    if (url.pathname === "/api/re10/analyze" && request.method() === "POST") {
      return json(route, fixtures.re10Analyze ?? {
        error: "fixture_missing",
        message: "The RE-10 analyze fixture was not installed.",
      }, fixtures.re10Analyze ? 200 : 500);
    }

    if (url.pathname === "/api/re10/estimate" && request.method() === "POST") {
      const submitted = requestJson(request);
      return json(route, {
        price: 18_750,
        validDays: 30,
        confidence: "medium",
        propertyAddress: submitted.propertyAddress ?? null,
        closingDate: submitted.closingDate ?? null,
        repairDeadline: submitted.repairDeadline ?? null,
        categories: [],
        needsOnsite: [],
        uncertainty: [],
        assumptions: ["Browser fixture; no provider delivery was attempted."],
        priced: 2,
        unpriced: 0,
        emailed: true,
      });
    }

    if (url.pathname === "/api/estimate-lead" && request.method() === "POST") {
      const submitted = requestJson(request);
      return json(route, {
        success: true,
        accepted: true,
        inquiryKey: "inq_e2e_fixture",
        conversionId: "conv_e2e_fixture",
        newInquiry: true,
        conversionEligible: false,
        estimate: submitted.estimate ?? null,
        deliveries: [
          { channel: "adminEmail", attempted: true, delivered: true },
          { channel: "customerEmail", attempted: true, delivered: true },
        ],
      });
    }

    // Lead conversion claims and server-side analytics must never write during
    // these tests. A neutral response also keeps client fire-and-forget code
    // from producing irrelevant errors.
    if (
      url.pathname === "/api/inquiry-conversion" ||
      url.pathname === "/api/meta-capi"
    ) {
      return json(route, { eligible: false, captured: false });
    }

    return json(route, {
      error: "blocked_by_e2e_harness",
      message: `No safe fixture is registered for ${request.method()} ${url.pathname}`,
    }, 418);
  });
}