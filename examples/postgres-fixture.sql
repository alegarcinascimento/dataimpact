-- Execute SOMENTE em banco de desenvolvimento próprio.
CREATE TABLE public.orders (order_id integer PRIMARY KEY, updated_at timestamptz NOT NULL);
INSERT INTO public.orders VALUES (1, '2026-01-01T10:00:00Z'), (2, '2026-01-01T10:05:00Z');
CREATE VIEW public.orders_summary AS SELECT count(*) AS total_orders FROM public.orders;
