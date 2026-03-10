import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useConfirmInstantReservation } from "../useConfirmInstantReservation";
import { confirmInstantReservationService } from "../../Service/ReservationService";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

// ── Mocks ──
jest.mock("../../Service/ReservationService", () => ({
  confirmInstantReservationService: jest.fn(),
}));

jest.mock("@/appSRC/notifications/Service/NotificationCrudService", () => ({
  createNotification: jest.fn(),
}));

// Mock Zustand AuthStore
const mockUser = { uid: "pro-uid-1" };
jest.mock("@/appSRC/auth/Store/AuthStore", () => ({
  useAuthStore: Object.assign(
    jest.fn(() => ({ user: mockUser })),
    {
      getState: jest.fn(() => ({ user: mockUser })),
      setState: jest.fn(),
      subscribe: jest.fn(),
      destroy: jest.fn(),
    },
  ),
}));

describe("useConfirmInstantReservation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("starts with processingId=null", () => {
    const { result } = renderHook(() => useConfirmInstantReservation());
    expect(result.current.processingId).toBeNull();
  });

  it("calls service with reservationId and professional uid", async () => {
    (confirmInstantReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmInstantReservation());

    await act(async () => {
      await result.current.confirmRequest("res-1");
    });

    expect(confirmInstantReservationService).toHaveBeenCalledWith("res-1", "pro-uid-1");
  });

  it("sends notification to client when clientId provided", async () => {
    (confirmInstantReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmInstantReservation());

    await act(async () => {
      await result.current.confirmRequest("res-1", undefined, "client-1");
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
    (confirmInstantReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmInstantReservation());

    await act(async () => {
      await result.current.confirmRequest("res-1");
    });

    expect(createNotification).not.toHaveBeenCalled();
  });

  it("calls onSuccess callback on success", async () => {
    (confirmInstantReservationService as jest.Mock).mockResolvedValue({});
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useConfirmInstantReservation());

    await act(async () => {
      await result.current.confirmRequest("res-1", onSuccess);
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows success alert on confirmation", async () => {
    (confirmInstantReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmInstantReservation());

    await act(async () => {
      await result.current.confirmRequest("res-1");
    });

    expect(Alert.alert).toHaveBeenCalledWith("¡Trabajo Aceptado!", expect.any(String));
  });

  it("shows error alert on service failure", async () => {
    (confirmInstantReservationService as jest.Mock).mockRejectedValue(new Error("Already taken"));

    const { result } = renderHook(() => useConfirmInstantReservation());

    await act(async () => {
      await result.current.confirmRequest("res-1");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", expect.any(String));
  });

  it("resets processingId after success", async () => {
    (confirmInstantReservationService as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmInstantReservation());

    await act(async () => {
      await result.current.confirmRequest("res-1");
    });

    expect(result.current.processingId).toBeNull();
  });

  it("resets processingId after failure", async () => {
    (confirmInstantReservationService as jest.Mock).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useConfirmInstantReservation());

    await act(async () => {
      await result.current.confirmRequest("res-1");
    });

    expect(result.current.processingId).toBeNull();
  });

  it("does nothing when user is null", async () => {
    // Override mock for this test
    const authStore = require("@/appSRC/auth/Store/AuthStore");
    authStore.useAuthStore.mockReturnValueOnce({ user: null });

    const { result } = renderHook(() => useConfirmInstantReservation());

    await act(async () => {
      await result.current.confirmRequest("res-1");
    });

    expect(confirmInstantReservationService).not.toHaveBeenCalled();
  });
});
