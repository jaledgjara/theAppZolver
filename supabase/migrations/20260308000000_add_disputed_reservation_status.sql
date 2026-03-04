-- Add 'disputed' to the reservation_status enum.
-- Required by the mp-webhook chargeback handler (line 388 in mp-webhook/index.ts).
-- Without this, the UPDATE silently fails with a PostgreSQL enum type error
-- when Mercado Pago sends a charged_back notification.

ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'disputed';
