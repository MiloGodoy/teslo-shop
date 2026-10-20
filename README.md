# Teslo Shop

Tienda con Next.js 16, React 19, Prisma 6, PostgreSQL y Cloudinary.

## Prueba local

1. Usa Node 22 (`nvm use`) e instala con `npm ci`.
2. Si aún no tienes `.env`, copia `.env.template`. No reemplaces un `.env` existente.
3. Configura PostgreSQL, `AUTH_TRUST_HOST=true` para la prueba local y `AUTH_SECRET` (`openssl rand -base64 32`). El puerto local de Docker es **5435**.
4. Ejecuta `docker compose up -d`, `npm run db:deploy` y `npm run db:init`.
5. Opcional: `npm run seed` agrega productos de demostración **solo en localhost**, sin borrar registros ni crear usuarios con contraseñas de prueba.
6. Ejecuta `npm run lint`, `npm run typecheck`, `npm test` y `npm run check:images`.
7. Ejecuta `npm run build` y `npm run start`. Abre http://localhost:3000.

Para desarrollo usa `npm run dev`. Las fuentes se incluyen localmente y el build no ejecuta migraciones.

### Cuenta administradora

En `.env` define temporalmente `ADMIN_EMAIL` y `ADMIN_PASSWORD` (12 a 72 caracteres) y ejecuta `npm run db:init`.
Esto crea una cuenta administradora solo si no existe. No cambia contraseñas ni eleva el rol de usuarios existentes.
Retira estas dos variables cuando termines. Si conservas cuentas del seed antiguo, cambia sus contraseñas antes de usar esa base públicamente; el seed antiguo incluía una cuenta administradora con contraseña de demostración.

### Volumen PostgreSQL existente

El Compose anterior montaba `/var/lib/postgres/data`, pero PostgreSQL escribe en `/var/lib/postgresql/data`.
La configuración actual usa un volumen persistente. Para una instalación nueva conserva los valores predeterminados de `.env.template`.
En esta máquina se añadieron a `.env` `POSTGRES_VOLUME_NAME` y `POSTGRES_VOLUME_EXTERNAL=true` para conservar el volumen que ya contiene los datos.
No borres ese volumen y no uses `docker compose down -v`.
Antes de aplicar el cambio local se creó un respaldo en `/tmp/teslo-shop-before-deploy.dump`; mueve ese respaldo a un lugar persistente si deseas conservarlo.

## Configurar Cloudinary

1. Abre https://console.cloudinary.com y selecciona tu entorno de producto.
2. En Settings → API Keys obtén **Cloud name**, **API Key** y **API Secret**.
3. En `.env` agrega `CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME`, reemplazando cada marcador. Si el panel ofrece una URL completa, copia su valor sin el prefijo `CLOUDINARY_URL=` duplicado.
4. Reinicia el servidor local para recargar variables.
5. Inicia sesión como administrador y abre `/admin/products`. Edita un producto o crea uno con `/admin/product/new`.
6. Selecciona JPG, PNG, WebP o AVIF, hasta 5 MB por archivo y 8 imágenes totales por producto, y pulsa Guardar.
7. Comprueba la imagen en la grilla, el detalle de escritorio y móvil, carrito, checkout y órdenes. Prueba también eliminarla desde administración.

La subida es **firmada**: el servidor autoriza al administrador, el navegador envía el archivo directamente a Cloudinary y el servidor verifica el recurso antes de asociarlo al producto.
No debes crear un preset unsigned ni hacer público el API Secret. No se necesita S3. El prefijo `teslo-shop/` se crea automáticamente en los identificadores de los recursos.
El archivo nunca atraviesa la función de Vercel; se guardan la URL HTTPS y el `public_id` para borrar correctamente.
Sin `CLOUDINARY_URL` funcionan las imágenes locales; subir o borrar recursos remotos requiere credenciales válidas.

## PayPal

Sin `NEXT_PUBLIC_PAYPAL_CLIENT_ID` la tienda funciona y muestra que los pagos aún no están configurados.
Para probar pagos usa credenciales Sandbox de la misma aplicación:

- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `PAYPAL_ENVIRONMENT=sandbox`
- `PAYPAL_MERCHANT_ID`: cuenta comerciante receptora, obligatorio en live.
- `PAYPAL_WEBHOOK_ID`: identificador del webhook configurado abajo.

El importe se calcula en el servidor y se verifica antes de marcar la orden como pagada. Los importes usan USD y mantienen el 10% que ya mostraba el carrito; confirma que esa tasa corresponda a tu negocio.
Los endpoints antiguos `PAYPAL_OAUTH_URL` y `PAYPAL_ORDERS_URL` ya no se usan: se derivan de `PAYPAL_ENVIRONMENT`.

Configura en la aplicación de PayPal un webhook para **PAYMENT.CAPTURE.COMPLETED** dirigido a `https://TU_DOMINIO/api/paypal/webhook` y copia su ID a `PAYPAL_WEBHOOK_ID`.
Localhost no es alcanzable por PayPal: para probar el webhook necesitas una URL HTTPS pública de pruebas o un túnel. La captura desde el botón puede probarse localmente sin webhook; el webhook asegura la conciliación si el comprador cierra la página.
En producción usa credenciales Live, `PAYPAL_ENVIRONMENT=live` y el webhook Live. No publiques cobros reales sin verificar también ese webhook.

## Despliegue en Vercel

1. Configura PostgreSQL externo con backups. Separa Preview y Production.
2. Obtén `DATABASE_URL` para ejecución (con pooling si el proveedor lo indica) y `DIRECT_URL` apta para migraciones. Usa las opciones SSL indicadas por el proveedor.
3. Desde un entorno controlado con las variables del destino correcto ejecuta `npm run db:deploy`, luego `npm run db:init`. El build no inicializa datos ni aplica migraciones. Nunca ejecutes el seed antiguo contra producción.
4. Sube los cambios y `package-lock.json` al repositorio. No subas `.env` ni datos de PostgreSQL.
5. Importa el repositorio en Vercel: Framework Next.js, Node 22.x, Install `npm ci`, Build `npm run build`, directorio de salida predeterminado.
6. En Settings → Environment Variables configura por separado Preview y Production:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | PostgreSQL del ambiente correspondiente |
| `DIRECT_URL` | Conexión de migraciones del mismo ambiente |
| `AUTH_SECRET` | Secreto aleatorio distinto por ambiente |
| `APP_URL` | URL pública del sitio; para Preview se puede omitir |
| `CLOUDINARY_URL` | Credenciales privadas de Cloudinary |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Client ID público del ambiente de PayPal |
| `PAYPAL_SECRET` | Secret privado del mismo ambiente |
| `PAYPAL_ENVIRONMENT` | `sandbox` para pruebas, `live` para cobros reales |
| `PAYPAL_MERCHANT_ID` | Comerciante receptor |
| `PAYPAL_WEBHOOK_ID` | Webhook del dominio y ambiente correspondiente |

No necesitas `DB_USER`, `DB_NAME`, `DB_PASSWORD`, `POSTGRES_VOLUME_*` ni variables `ADMIN_*` en el runtime de Vercel.
Los secretos nunca deben llevar el prefijo `NEXT_PUBLIC_`. Si cambias variables, vuelve a desplegar; el Client ID público se integra durante el build.
7. Prueba Preview: login, roles, imágenes, subida y borrado, direcciones, compra Sandbox y webhook. Verifica que la protección de Preview no bloquee la URL del webhook.
8. Configura dominio y variables productivas, ejecuta migraciones pendientes y despliega Production. Repite las pruebas funcionales.

## Comprobaciones y límites

`npm test` comprueba montos, validación de cantidades/talles, rutas de imágenes e integridad de pagos.
Las pruebas reales de Cloudinary y PayPal requieren tus cuentas y credenciales. El estado de la cuenta, cuotas, correos y reglas comerciales deben verificarse antes de cobrar.
El catálogo de demostración usa archivos existentes o placeholder cuando no existe la fotografía original. El seed conserva productos existentes en lugar de sobrescribirlos.

### Dependencias de herramientas

Se fijó `deepmerge-ts@8.0.0` solo para `@prisma/config` para corregir su aviso de seguridad sin migrar Prisma a otra versión mayor. Se verifican generación de cliente, validación de esquema y carga de configuración con esa dependencia.
`npm audit` completo aún informa avisos en las herramientas de análisis de archivos y CSS (ESLint/Tailwind). No se ejecutó `audit fix --force`, que propone migraciones mayores. Revisa esos avisos antes de incorporar patrones o CSS externos no confiables a las herramientas de build.
