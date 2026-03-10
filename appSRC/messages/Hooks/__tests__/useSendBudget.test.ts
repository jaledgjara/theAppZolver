import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useSendBudget } from "../useSendBudget";
import { MessageService } from "../../Service/MessageService";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

// ── Mocks ──
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("../../Service/MessageService", () => ({
  MessageService: {
    sendBudgetProposal: jest.fn(),
  },
}));

jest.mock("@/appSRC/notifications/Service/NotificationCrudService", () => ({
  createNotification: jest.fn(),
}));

const mockUser = { uid: "pro-uid-1" };
jest.mock("@/appSRC/auth/Store/AuthStore", () => ({
  useAuthStore: Object.assign(
    jest.fn((selector: (s: { user: typeof mockUser }) => unknown) => selector({ user: mockUser })),
    {
      getState: jest.fn(() => ({ user: mockUser })),
      setState: jest.fn(),
      subscribe: jest.fn(),
      destroy: jest.fn(),
    },
  ),
}));

describe("useSendBudget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("starts with loading=false", () => {
    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));
    expect(result.current.loading).toBe(false);
  });

  // ── Price sanitization (Argentina format) ──
  it("sanitizes Argentine thousand-separator dots (2.000.000 → 2000000)", async () => {
    (MessageService.sendBudgetProposal as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "2.000.000", "Incluye materiales");
    });

    expect(MessageService.sendBudgetProposal).toHaveBeenCalledWith(
      "conv-1",
      "pro-uid-1",
      "client-1",
      expect.objectContaining({ price: 2000000 }),
    );
  });

  it("converts decimal comma to dot (1500,50 → 1500.50)", async () => {
    (MessageService.sendBudgetProposal as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Limpieza", "1500,50", "");
    });

    expect(MessageService.sendBudgetProposal).toHaveBeenCalledWith(
      "conv-1",
      "pro-uid-1",
      "client-1",
      expect.objectContaining({ price: 1500.5 }),
    );
  });

  it("handles combined format: 2.500,75 → 2500.75", async () => {
    (MessageService.sendBudgetProposal as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Electricidad", "2.500,75", "");
    });

    expect(MessageService.sendBudgetProposal).toHaveBeenCalledWith(
      "conv-1",
      "pro-uid-1",
      "client-1",
      expect.objectContaining({ price: 2500.75 }),
    );
  });

  // ── Budget payload structure ──
  it("builds correct BudgetPayload", async () => {
    (MessageService.sendBudgetProposal as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Plomería", "5000", "Arreglo de caño");
    });

    expect(MessageService.sendBudgetProposal).toHaveBeenCalledWith(
      "conv-1",
      "pro-uid-1",
      "client-1",
      expect.objectContaining({
        serviceName: "Plomería",
        price: 5000,
        currency: "ARS",
        status: "pending_approval",
        notes: "Arreglo de caño",
      }),
    );
  });

  // ── Notification ──
  it("sends notification to client on success", async () => {
    (MessageService.sendBudgetProposal as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "3000", "");
    });

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "client-1",
        type: "budget_received",
        data: expect.objectContaining({ conversation_id: "conv-1" }),
      }),
    );
  });

  // ── Validation ──
  it("shows alert if title is empty", async () => {
    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("", "1000", "");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Campos requeridos", expect.any(String));
    expect(MessageService.sendBudgetProposal).not.toHaveBeenCalled();
  });

  it("shows alert if price is empty", async () => {
    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "", "");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Campos requeridos", expect.any(String));
    expect(MessageService.sendBudgetProposal).not.toHaveBeenCalled();
  });

  it("rejects invalid price (NaN)", async () => {
    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "abc", "");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", expect.any(String));
    expect(MessageService.sendBudgetProposal).not.toHaveBeenCalled();
  });

  it("rejects zero price", async () => {
    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "0", "");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", expect.any(String));
  });

  it("rejects negative price", async () => {
    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "-500", "");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", expect.any(String));
  });

  // ── Error handling ──
  it("shows error alert on service failure", async () => {
    (MessageService.sendBudgetProposal as jest.Mock).mockRejectedValue(
      new Error("DB insert failed"),
    );

    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "3000", "");
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", expect.any(String));
  });

  it("resets loading after success", async () => {
    (MessageService.sendBudgetProposal as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "3000", "");
    });

    expect(result.current.loading).toBe(false);
  });

  it("resets loading after error", async () => {
    (MessageService.sendBudgetProposal as jest.Mock).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "3000", "");
    });

    expect(result.current.loading).toBe(false);
  });

  // ── No user ──
  it("does nothing when user is null", async () => {
    const authStore = require("@/appSRC/auth/Store/AuthStore");
    authStore.useAuthStore.mockImplementationOnce((selector: (s: { user: null }) => unknown) =>
      selector({ user: null }),
    );

    const { result } = renderHook(() => useSendBudget("conv-1", "client-1"));

    await act(async () => {
      await result.current.sendBudget("Pintura", "3000", "");
    });

    expect(MessageService.sendBudgetProposal).not.toHaveBeenCalled();
  });
});
