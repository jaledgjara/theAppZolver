import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useBudgetValidation } from "../useBudgetValidation";
import { getBudgetStatusService } from "@/appSRC/messages/Service/MessageService";

// ── Mocks ──
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/appSRC/messages/Service/MessageService", () => ({
  getBudgetStatusService: jest.fn(),
}));

describe("useBudgetValidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  // ── Valid statuses ──
  it("sets isValid=true for pending_approval status", async () => {
    (getBudgetStatusService as jest.Mock).mockResolvedValue("pending_approval");

    const { result } = renderHook(() => useBudgetValidation("msg-1"));

    await waitFor(() => {
      expect(result.current.validating).toBe(false);
    });

    expect(result.current.isValid).toBe(true);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("sets isValid=true for legacy pending status", async () => {
    (getBudgetStatusService as jest.Mock).mockResolvedValue("pending");

    const { result } = renderHook(() => useBudgetValidation("msg-1"));

    await waitFor(() => {
      expect(result.current.validating).toBe(false);
    });

    expect(result.current.isValid).toBe(true);
  });

  // ── Invalid statuses ──
  it("sets isValid=false and shows alert for confirmed status", async () => {
    (getBudgetStatusService as jest.Mock).mockResolvedValue("confirmed");

    const { result } = renderHook(() => useBudgetValidation("msg-1"));

    await waitFor(() => {
      expect(result.current.validating).toBe(false);
    });

    expect(result.current.isValid).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      "Aviso",
      "Este presupuesto ya fue aceptado anteriormente.",
      expect.any(Array),
    );
  });

  it("shows correct alert for rejected status", async () => {
    (getBudgetStatusService as jest.Mock).mockResolvedValue("rejected");

    const { result } = renderHook(() => useBudgetValidation("msg-1"));

    await waitFor(() => {
      expect(result.current.validating).toBe(false);
    });

    expect(result.current.isValid).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      "Aviso",
      "Este presupuesto fue rechazado.",
      expect.any(Array),
    );
  });

  it("shows correct alert for expired status", async () => {
    (getBudgetStatusService as jest.Mock).mockResolvedValue("expired");

    const { result } = renderHook(() => useBudgetValidation("msg-1"));

    await waitFor(() => {
      expect(result.current.validating).toBe(false);
    });

    expect(result.current.isValid).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      "Aviso",
      "El presupuesto ha expirado.",
      expect.any(Array),
    );
  });

  it("shows generic alert for completed status", async () => {
    (getBudgetStatusService as jest.Mock).mockResolvedValue("completed");

    const { result } = renderHook(() => useBudgetValidation("msg-1"));

    await waitFor(() => {
      expect(result.current.validating).toBe(false);
    });

    expect(result.current.isValid).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      "Aviso",
      "Este presupuesto ya fue aceptado anteriormente.",
      expect.any(Array),
    );
  });

  it("shows generic alert for unknown status", async () => {
    (getBudgetStatusService as jest.Mock).mockResolvedValue("some_unknown_status");

    const { result } = renderHook(() => useBudgetValidation("msg-1"));

    await waitFor(() => {
      expect(result.current.validating).toBe(false);
    });

    expect(result.current.isValid).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      "Aviso",
      "Este presupuesto ya no está disponible.",
      expect.any(Array),
    );
  });

  // ── Empty messageId guard ──
  it("does not call service when messageId is empty", async () => {
    const { result } = renderHook(() => useBudgetValidation(""));

    // Give it a tick
    await act(async () => {});

    expect(getBudgetStatusService).not.toHaveBeenCalled();
  });

  // ── Revalidation ──
  it("revalidate re-fetches status", async () => {
    (getBudgetStatusService as jest.Mock)
      .mockResolvedValueOnce("pending_approval")
      .mockResolvedValueOnce("confirmed");

    const { result } = renderHook(() => useBudgetValidation("msg-1"));

    await waitFor(() => {
      expect(result.current.validating).toBe(false);
    });
    expect(result.current.isValid).toBe(true);

    await act(async () => {
      await result.current.revalidate();
    });

    expect(result.current.isValid).toBe(false);
    expect(getBudgetStatusService).toHaveBeenCalledTimes(2);
  });
});
