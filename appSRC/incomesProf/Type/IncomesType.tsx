export interface IncomePayload {
  incomeToday: number; // Para "Ganancias del día"
  totalMonth: number; // Para "Ganancias del mes"
  pendingPayment: number; // Para "Por Cobrar"
  topService: string; // Para "Mi servicio" (Opcional, si viene del back)
  chartData: {
    label: string;
    value: number;
  }[];
}
