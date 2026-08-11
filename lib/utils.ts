import { ReadonlyURLSearchParams } from "next/navigation";

// Honour an explicit NEXT_PUBLIC_SITE_URL first (e.g. when deploying somewhere
// other than Vercel, or when the production domain differs from the Vercel
// auto-assigned one). Vercel's own env var is the second-choice fallback, and
// localhost is the dev default.
function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const baseUrl = resolveBaseUrl();

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams,
) => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;

  return `${pathname}${queryString}`;
};

export const ensureStartsWith = (stringToCheck: string, startsWith: string) =>
  stringToCheck.startsWith(startsWith)
    ? stringToCheck
    : `${startsWith}${stringToCheck}`;

export const validateEnvironmentVariables = () => {
  const required = ["WC_URL", "WC_CONSUMER_KEY", "WC_CONSUMER_SECRET"];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables:\n${missing.join("\n")}\n`,
    );
  }
};
