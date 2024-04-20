import type { LocaleCode } from "~/locales/server";
import { fallbackLocale, locales } from "~/locales/shared";
import { createI18nMiddleware } from "next-international/middleware";
import type { NextRequest } from "next/server";

const I18nMiddleware = createI18nMiddleware({
	locales,
	defaultLocale: fallbackLocale,
	urlMappingStrategy: "rewriteDefault",
});

export function middleware(request: NextRequest) {
	// Workaround to have to cookie available in the first request
	const pathname = request.nextUrl.pathname;
	let localePath = pathname.split("/", 2)[1] as LocaleCode | undefined;
	localePath =
		localePath && locales.includes(localePath) ? localePath : undefined;

	const locale =
		request.cookies.get("Next-Locale")?.value ?? localePath ?? fallbackLocale;
	request.cookies.set("Next-Locale", locale);

	return I18nMiddleware(request);
}

export const config = {
	matcher: ["/((?!api|static|.*\\..*|_next).*)"],
};
