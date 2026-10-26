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
una papeleta por dirección de correo registrada, que se puede actualizar.
El formulario manual no verifica que el correo pertenezca a quien lo introduce.

**3. Ves los resultados.** Un recuento en vivo con dos vistas: unas marcas
de conteo dibujadas a mano (como cuando alguien cuenta votos con lápiz y
papel) y un gráfico de barras, más el desglose de participación por
comunidad autónoma.

## Por qué está hecho así

- **Sin servidor propio que mantener.** Toda la base de datos vive en
  Supabase (Postgres gratuito), así que no hay nada que administrar salvo
  la propia tabla de datos.
- **Una papeleta por correo registrado**, mediante un campo único en la
  base de datos. Esto no garantiza un voto por persona: una persona puede
  introducir distintas direcciones y el acceso manual no verifica su titularidad.
- **Las candidaturas y sus colores se editan sin tocar código**, directamente
  desde una tabla en Supabase.

## Límites de privacidad y seguridad

El archivo `supabase-setup.sql` permite lectura pública de las filas de votos
(incluidos nombre, correo y elección) y actualización pública sin comprobar
la titularidad del correo. No debe utilizarse tal cual para recoger datos
personales reales ni para un sondeo con garantías de identidad.

Antes de ese uso, hay que proteger los votos con identidad verificada y
permisos por usuario, y publicar únicamente resultados agregados sin datos
identificativos. Ocultar campos en la interfaz no protege la base de datos.
Este aviso documenta el esquema del repositorio; no verifica ni cambia la
configuración del servicio desplegado.

## Tecnología

React · Vite · Tailwind CSS · Recharts · Supabase (Postgres + Auth)

## ¿Quieres montar tu propia versión?

Toda la parte técnica — crear el proyecto en Supabase, activar el login
de Google, desplegar en Vercel — está en **[`SETUP.md`](./SETUP.md)**.

## Licencia

MIT — úsalo, modifícalo y despliega tu propia versión libremente.
