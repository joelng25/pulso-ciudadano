# 🗳️ Pulso Ciudadano

Una web de sondeo de opinión electoral: la gente entra, dice a quién votaría
y ve en tiempo real cómo va la encuesta, papeleta a papeleta.

> Es una **encuesta de opinión independiente**, no un proceso electoral
> oficial ni un sistema de votación certificado — más parecido a esos
> sondeos que publican los medios, pero abierto y con los resultados
> siempre a la vista.

## Cómo funciona

**1. Te identificas.** Con un clic en "Continuar con Google", o escribiendo
tu nombre, correo y comunidad autónoma a mano.

**2. Marcas tu papeleta.** Una lista de candidaturas en formato de voto,
una opción por persona — el correo queda registrado, así que no se puede
votar dos veces.

**3. Ves los resultados.** Un recuento en vivo con dos vistas: unas marcas
de conteo dibujadas a mano (como cuando alguien cuenta votos con lápiz y
papel) y un gráfico de barras, más el desglose de participación por
comunidad autónoma.

## Por qué está hecho así

- **Sin servidor propio que mantener.** Toda la base de datos vive en
  Supabase (Postgres gratuito), así que no hay nada que administrar salvo
  la propia tabla de datos.
- **Un voto por persona, garantizado por la base de datos** — no por
  confiar en que nadie haga trampa, sino porque el correo es un campo único
  a nivel de base de datos.
- **Las candidaturas y sus colores se editan sin tocar código**, directamente
  desde una tabla en Supabase.

## Tecnología

React · Vite · Tailwind CSS · Recharts · Supabase (Postgres + Auth)

## ¿Quieres montar tu propia versión?

Toda la parte técnica — crear el proyecto en Supabase, activar el login
de Google, desplegar en Vercel — está en **[`SETUP.md`](./SETUP.md)**.

## Licencia

MIT — úsalo, modifícalo y despliega tu propia versión libremente.
