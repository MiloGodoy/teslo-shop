# Descripción
Ecommerce minimalista desarrollado con NextJs, Prisma, Zustand


## Correr en dev

1. Clonar el repositorio.
2. Crear una copia del ```.env.template``` y renombrarlo a ```.env```y cambiar las variables de entorno.
3. Instalar las dependencias ```npm instal```
4. Levantar la base de datos ```docker compose up -d```
5. Correr las migraciones de Prisma ```npx prisma migrate dev```,
(para visualizar la base de datos en el navegador correr: ```npx prisma studio
```).
6. Ejecutar seed ```npm run seed```
7. Limpiar el localStorage del navegador.
8. Correr el proyecto ```npm run dev```






## Correr en prod