import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useCreateReservation } from "../useCreateReservation";
import { createInstantReservation, createQuoteReservation } from "../../Service/ReservationService";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";
import { ReservationPayload } from "../../Type/ReservationType";

// ── Mocks ──
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("../../Service/ReservationService", () => ({
  createInstantReservation: jest.fn(),
  createQuoteReservation: jest.fn(),
}));

jest.mock("@/appSRC/notifications/Service/NotificationCrudService", () => ({
  createNotification: jest.fn(),
}));

// ── Helpers ──
const BASE_PAYLOAD: ReservationPayload = {
  client_id: "client-1",
  professional_id: "pro-1",
  service_category: "plomería",
  service_modality: "instant",
  title: "plomería",
  description: "",
  service_tags: [],
  address_street: "Av. Corrientes 1234",
  address_number: "1234",
  address_coords: undefined,
  currency: "ARS",
  scheduled_range: "[2025-01-01,2025-01-02)",
  status: "pending_approval",
  price_estimated: 5000,
  price_final: 5500,
};

describe("useCreateReservation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("starts with loading=false", () => {
    const { result } = renderHook(() => useCreateReservation());
    expect(result.current.loading).toBe(false);
  });

  // ── Instant mode ──
  it("calls createInstantReservation for instant mode", async () => {
    (createInstantReservation as jest.Mock).mockResolvedValue({ id: "res-1" });

    const { result } = renderHook(() => useCreateReservation());

    await act(async () => {
      await result.current.createReservation("instant", BASE_PAYLOAD);
    });

    expect(createInstantReservation).toHaveBeenCalledWith(BASE_PAYLOAD);
    expect(createQuoteReservation).not.toHaveBeenCalled();
  });

  // ── Quote mode ──
  it("calls createQuoteReservation for quote mode", async () => {
    (createQuoteReservation as jest.Mock).mockResolvedValue({ id: "res-2" });

    const { result } = renderHook(() => useCreateReservation());

    await act(async () => {
      await result.current.createReservation("quote", BASE_PAYLOAD);
    });

    expect(createQuoteReservation).toHaveBeenCalledWith(BASE_PAYLOAD);
    expect(createInstantReservation).not.toHaveBeenCalled();
  });

  // ── Notification ──
  it("sends notification to the professional on success", async () => {
    (createInstantReservation as jest.Mock).mockResolvedValue({ id: "res-3" });

    const { result } = renderHook(() => useCreateReservation());

    await act(async () => {
      await result.current.createReservation("instant", BASE_PAYLOAD);
    });

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "pro-1",
        type: "reservation_new",
      }),
    );
  });

  it("uses correct notification title per mode", async () => {
    (createQuoteReservation as jest.Mock).mockResolvedValue({ id: "res-4" });

    const { result } = renderHook(() => useCreateReservation());

    await act(async () => {
      await result.current.createReservation("quote", BASE_PAYLOAD);
    });

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Nueva consulta de presupuesto",
      }),
    );
  });

  // ── Success alert ──
  it("shows success alert with instant title", async () => {
    (createInstantReservation as jest.Mock).mockResolvedValue({ id: "res-5" });

    const { result } = renderHook(() => useCreateReservation());

    await act(async () => {
      await result.current.createReservation("instant", BASE_PAYLOAD);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Solicitud Enviada",
      expect.any(String),
      expect.any(Array),
    );
  });

  it("shows success alert with quote title", async () => {
    (createQuoteReservation as jest.Mock).mockResolvedValue({ id: "res-6" });

    const { result } = renderHook(() => useCreateReservation());

    await act(async () => {
      await result.current.createReservation("quote", BASE_PAYLOAD);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Presupuesto Iniciado",
      expect.any(String),
      expect.any(Array),
    );
  });

  // ── Error handling ──
  it("shows error alert on service failure", async () => {
    (createInstantReservation as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCreateReservation());

    await act(async () => {
      await result.current.createReservation("instant", BASE_PAYLOAD);
    });

    expect(Alert.alert).toHaveBeenCalledWith("No se pudo crear", "Network error");
  });

  it("resets loading to false after error", async () => {
    (createInstantReservation as jest.Mock).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useCreateReservation());

    await act(async () => {
      await result.current.createReservation("instant", BASE_PAYLOAD);
    });

    expect(result.current.loading).toBe(false);
  });

  it("resets loading to false after success", async () => {
    (createInstantReservation as jest.Mock).mockResolvedValue({ id: "res-7" });

    const { result } = renderHook(() => useCreateReservation());

    await act(async () => {
      await result.current.createReservation("instant", BASE_PAYLOAD);
    });

    expect(result.current.loading).toBe(false);
  });
});
