import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useConfirmBudget } from "../useConfirmBudget";
import { confirmBudgetService } from "../../Service/ReservationService";
import { updateBudgetMessageStatusService } from "@/appSRC/messages/Service/MessageService";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

// ── Mocks ──
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("../../Service/ReservationService", () => ({
  confirmBudgetService: jest.fn(),
}));

jest.mock("@/appSRC/messages/Service/MessageService", () => ({
  updateBudgetMessageStatusService: jest.fn(),
}));

jest.mock("@/appSRC/notifications/Service/NotificationCrudService", () => ({
  createNotification: jest.fn(),
}));

const BUDGET_PAYLOAD = {
  serviceName: "Plomería",
  price: 5000,
  currency: "ARS",
  notes: "Arreglo de caño",
};

describe("useConfirmBudget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("starts with loading=false", () => {
    const { result } = renderHook(() => useConfirmBudget());
    expect(result.current.loading).toBe(false);
  });

  // ── Step 1: Create reservation ──
  it("calls confirmBudgetService with correct args", async () => {
    (confirmBudgetService as jest.Mock).mockResolvedValue("res-1");
    (updateBudgetMessageStatusService as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useConfirmBudget());

    await act(async () => {
      await result.current.confirmBudget("client-1", "pro-1", BUDGET_PAYLOAD, "msg-1");
    });

    expect(confirmBudgetService).toHaveBeenCalledWith("client-1", "pro-1", BUDGET_PAYLOAD);
  });

  // ── Step 2: Update message status to confirmed ──
  it("updates budget message status to confirmed", async () => {
    (confirmBudgetService as jest.Mock).mockResolvedValue("res-1");
    (updateBudgetMessageStatusService as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useConfirmBudget());

    await act(async () => {
      await result.current.confirmBudget("client-1", "pro-1", BUDGET_PAYLOAD, "msg-1");
    });

    expect(updateBudgetMessageStatusService).toHaveBeenCalledWith("msg-1", {
      ...BUDGET_PAYLOAD,
      status: "confirmed",
    });
  });

  // ── Step 3: Notification ──
  it("sends notification to professional on success", async () => {
    (confirmBudgetService as jest.Mock).mockResolvedValue("res-1");
    (updateBudgetMessageStatusService as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useConfirmBudget());

    await act(async () => {
      await result.current.confirmBudget("client-1", "pro-1", BUDGET_PAYLOAD, "msg-1");
    });

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "pro-1",
        type: "budget_accepted",
        data: expect.objectContaining({ reservation_id: "res-1" }),
      }),
    );
  });

  // ── Step 4: Success alert ──
  it("shows success alert on completion", async () => {
    (confirmBudgetService as jest.Mock).mockResolvedValue("res-1");
    (updateBudgetMessageStatusService as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useConfirmBudget());

    await act(async () => {
      await result.current.confirmBudget("client-1", "pro-1", BUDGET_PAYLOAD, "msg-1");
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "¡Éxito!",
      "Servicio contratado correctamente.",
      expect.any(Array),
    );
  });

  // ── Resilience: message update failure does NOT block flow ──
  it("still succeeds when message update fails", async () => {
    (confirmBudgetService as jest.Mock).mockResolvedValue("res-1");
    (updateBudgetMessageStatusService as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useConfirmBudget());

    await act(async () => {
      await result.current.confirmBudget("client-1", "pro-1", BUDGET_PAYLOAD, "msg-1");
    });

    // Should still show success and notify
    expect(Alert.alert).toHaveBeenCalledWith("¡Éxito!", expect.any(String), expect.any(Array));
    expect(createNotification).toHaveBeenCalled();
  });

  // ── Error handling ──
  it("shows error alert when confirmBudgetService throws", async () => {
    (confirmBudgetService as jest.Mock).mockRejectedValue(new Error("DB error"));

    const { result } = renderHook(() => useConfirmBudget());

    await act(async () => {
      await result.current.confirmBudget("client-1", "pro-1", BUDGET_PAYLOAD, "msg-1");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Hubo un problema al confirmar la reserva.");
    expect(updateBudgetMessageStatusService).not.toHaveBeenCalled();
  });

  it("does not send notification on error", async () => {
    (confirmBudgetService as jest.Mock).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useConfirmBudget());

    await act(async () => {
      await result.current.confirmBudget("client-1", "pro-1", BUDGET_PAYLOAD, "msg-1");
    });

    expect(createNotification).not.toHaveBeenCalled();
  });

  // ── Loading state ──
  it("resets loading after success", async () => {
    (confirmBudgetService as jest.Mock).mockResolvedValue("res-1");
    (updateBudgetMessageStatusService as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useConfirmBudget());

    await act(async () => {
      await result.current.confirmBudget("client-1", "pro-1", BUDGET_PAYLOAD, "msg-1");
    });

    expect(result.current.loading).toBe(false);
  });

  it("resets loading after error", async () => {
    (confirmBudgetService as jest.Mock).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useConfirmBudget());

    await act(async () => {
      await result.current.confirmBudget("client-1", "pro-1", BUDGET_PAYLOAD, "msg-1");
    });

    expect(result.current.loading).toBe(false);
  });
});
