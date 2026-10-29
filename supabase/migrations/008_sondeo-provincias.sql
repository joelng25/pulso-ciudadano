-- Distribuye el sondeo de ejemplo existente entre las provincias de cada
-- comunidad. Solo afecta a filas marcadas como sondeo de ejemplo y no a
-- votos reales. La distribución es sintética: no representa una encuesta
-- oficial por provincia.
WITH ranked AS (
  SELECT
    v.id,
    v.region,
    row_number() OVER (PARTITION BY v.region, v.candidate ORDER BY v.id) AS rn
  FROM public.votes v
  WHERE v.email LIKE 'sondeo-%@ejemplo.invalid'
),
province_lists AS (
  SELECT region, array_agg(name ORDER BY name) AS names
  FROM public.provinces
  GROUP BY region
),
assigned AS (
  SELECT r.id, p.names[((r.rn - 1) % cardinality(p.names)) + 1] AS province
  FROM ranked r
  JOIN province_lists p ON p.region = r.region
)
UPDATE public.votes v
SET province = a.province
FROM assigned a
WHERE v.id = a.id;
