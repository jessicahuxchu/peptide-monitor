import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/health(.*)",
  "/api/cron/(.*)",
  "/api/platform/seed(.*)",
  "/api/supply-chain/seed(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    if (!isPublicApiRoute(req)) {
      await auth.protect();
    }
    return;
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
