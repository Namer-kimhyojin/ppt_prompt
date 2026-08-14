import { verifyAdminSession } from "../cloudflare/admin-auth.js";

const PUBLIC_APP_PATHS = new Set(["/", "/index.html"]);

function buildPublicAppCsp(nonce) {
  return [
    "object-src 'none'",
    `script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:`,
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

async function servePublicApp(context) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const requestHeaders = new Headers(context.request.headers);
  requestHeaders.delete("if-none-match");
  requestHeaders.delete("if-modified-since");
  const response = await context.next(new Request(context.request, { headers: requestHeaders }));
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", buildPublicAppCsp(nonce));
  headers.set("Cache-Control", "private, no-store, max-age=0");
  const securedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  if (context.request.method.toUpperCase() === "HEAD"
    || !String(headers.get("content-type") || "").toLowerCase().includes("text/html")) {
    return securedResponse;
  }

  return new HTMLRewriter()
    .on("script", {
      element(element) {
        element.setAttribute("nonce", nonce);
      },
    })
    .transform(securedResponse);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (PUBLIC_APP_PATHS.has(url.pathname)
    && ["GET", "HEAD"].includes(context.request.method.toUpperCase())) {
    return servePublicApp(context);
  }
  if (!["/admin", "/admin.html"].includes(url.pathname)) return context.next();
  if (!["GET", "HEAD"].includes(context.request.method.toUpperCase())) {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const session = await verifyAdminSession(context.request, context.env);
  if (!session) {
    return Response.redirect(`${url.origin}/?admin=locked`, 302);
  }
  return context.next();
}
