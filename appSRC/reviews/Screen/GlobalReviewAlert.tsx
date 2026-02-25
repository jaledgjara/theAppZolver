import React from "react";
import ReviewModal from "./ReviewModal";
import { useGlobalReviewAlert } from "../Hooks/useGlobalReviewAlert";

/**
 * Global review alert that pops up anywhere in the client app
 * when a reservation is completed and hasn't been reviewed.
 * Like Uber/PedidosYa - appears regardless of which screen you're on.
 *
 * Place this in the client _layout.tsx.
 */
const GlobalReviewAlert: React.FC = () => {
  const {
    modalVisible,
    pendingReview,
    isSubmitting,
    handleSubmit,
    handleDismiss,
  } = useGlobalReviewAlert();

  if (!pendingReview) return null;

  return (
    <ReviewModal
      visible={modalVisible}
      professionalName={pendingReview.professionalName}
      onClose={handleDismiss}
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
    />
  );
};

export default GlobalReviewAlert;
