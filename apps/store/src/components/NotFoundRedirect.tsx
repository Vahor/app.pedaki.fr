"use client";

import { fallbackLocale, locales } from "~/locales/shared";
import { getCookie } from "cookies-next";
import { redirect, usePathname } from "next/navigation";

// https://github.com/QuiiBz/next-international/blob/main/packages/next-international/src/common/constants.ts#L2
const LOCALE_COOKIE = "Next-Locale";

const NotFoundRedirectComponent = () => {
	const cookieLocale = getCookie(LOCALE_COOKIE);
	const locale =
		cookieLocale && locales.includes(cookieLocale)
			? cookieLocale
			: fallbackLocale;
	const pathname = usePathname();

	redirect(`/${locale}${pathname}`);
	return null;
};

export default NotFoundRedirectComponent;
