import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    const scrollOptions: ScrollToOptions = {
      top: 0,
      left: 0,
      behavior: "instant" as ScrollBehavior,
    };

    try {
      window.scrollTo(scrollOptions);
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};
