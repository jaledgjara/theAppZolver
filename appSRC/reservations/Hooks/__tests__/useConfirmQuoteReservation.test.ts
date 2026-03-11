import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useConfirmQuoteReservation } from "../useConfirmQuoteReservation";
import { confirmQuoteReservationService } from "../../Service/ReservationService";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

// ── Mocks ──
jest.mock("../../Service/ReservationService", () => ({
  confirmQuoteReservationService: jest.fn(),
}));

jest.mock("@/appSRC/notifications/Service/NotificationCrudService", () => ({
  createNotification: jest.fn(),
}));

const mockUser = { uid: "pro-uid-1" };
jest.mock("@/appSRC/auth/Store/AuthStore", () => ({
  useAuthStore: jest.fn(() => ({ user: mockUser })),
}));

describe("useConfirmQuoteReservation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("starts with loading=false", () => {
    const { result } = renderHook(() => useConfirmQuoteReservation());
    expect(result.current.loading).toBe(false);
  });

  it("calls service with reservationId and professional uid", async () => {
    (confirmQuoteReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1");
    });

    expect(confirmQuoteReservationService).toHaveBeenCalledWith("res-1", "pro-uid-1");
  });

  it("sends notification to client when clientId provided", async () => {
    (confirmQuoteReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1", undefined, "client-1");
    });

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "client-1",
        type: "reservation_accepted",
        data: expect.objectContaining({ reservation_id: "res-1" }),
      }),
    );
  });

  it("does NOT send notification when no clientId", async () => {
    (confirmQuoteReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1");
    });

    expect(createNotification).not.toHaveBeenCalled();
  });

  it("shows success alert on confirmation", async () => {
    (confirmQuoteReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1");
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Trabajo aceptado",
      "Se agregó a tu agenda de trabajos.",
    );
  });

  it("calls onSuccess callback on success", async () => {
    (confirmQuoteReservationService as jest.Mock).mockResolvedValue({});
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1", onSuccess);
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  // ── Error handling ──
  it("shows error alert with message on service failure", async () => {
    (confirmQuoteReservationService as jest.Mock).mockRejectedValue(new Error("Already confirmed"));

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Already confirmed");
  });

  it("shows fallback error for non-Error throws", async () => {
    (confirmQuoteReservationService as jest.Mock).mockRejectedValue("unknown");

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Error al confirmar el trabajo.");
  });

  // ── Loading state ──
  it("resets loading after success", async () => {
    (confirmQuoteReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1");
    });

    expect(result.current.loading).toBe(false);
  });

  it("resets loading after failure", async () => {
    (confirmQuoteReservationService as jest.Mock).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1");
    });

    expect(result.current.loading).toBe(false);
  });

  // ── No user guard ──
  it("does nothing when user is null", async () => {
    const authStore = require("@/appSRC/auth/Store/AuthStore");
    authStore.useAuthStore.mockReturnValueOnce({ user: null });

    const { result } = renderHook(() => useConfirmQuoteReservation());

    await act(async () => {
      await result.current.confirmQuoteRequest("res-1");
    });

    expect(confirmQuoteReservationService).not.toHaveBeenCalled();
  });
});
