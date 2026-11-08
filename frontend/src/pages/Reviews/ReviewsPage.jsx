import { useEffect, useState } from "react";
import useReviewsPage from "./hooks/useReviewsPage";
import ReviewsDesktopView from "./views/ReviewsDesktopView";
import ReviewsMobileView from "./views/ReviewsMobileView";

function getIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export default function ReviewsPage() {
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const { reviews, isLoading, isNavigatingToReview, goToLastOrderReview } =
    useReviewsPage();

  useEffect(() => {
    function onResize() {
      setIsMobile(getIsMobile());
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isMobile) {
    return (
      <ReviewsMobileView
        reviews={reviews}
        isLoading={isLoading}
        isNavigatingToReview={isNavigatingToReview}
        onGoToLastOrderReview={goToLastOrderReview}
      />
    );
  }

  return (
    <ReviewsDesktopView
      reviews={reviews}
      isLoading={isLoading}
      isNavigatingToReview={isNavigatingToReview}
      onGoToLastOrderReview={goToLastOrderReview}
    />
  );
}
