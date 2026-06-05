# Guía de Despliegue en Producción - Ubuntu Server

Esta guía detalla los pasos para instalar, configurar y levantar la aplicación **POS Mat Monar** en un entorno de producción utilizando **Ubuntu Server**.

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener acceso SSH a tu servidor Ubuntu Server con un usuario que tenga privilegios de `sudo`.

---

## Paso 1: Actualizar el Sistema e Instalar Dependencias

Ejecuta los siguientes comandos para actualizar la lista de paquetes e instalar las herramientas necesarias:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential libssl-dev nginx
```

---

## Paso 2: Instalar Node.js (Versión 20 LTS) y PM2

Recomendamos utilizar Node.js 20. Instalaremos Node.js desde el repositorio oficial de NodeSource:

```bash
# Descargar e instalar el script de NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar la instalación
node -v
npm -v

# Instalar PM2 globalmente (gestor de procesos para Node.js)
sudo npm install -g pm2
```

---

## Paso 3: Instalar y Configurar PostgreSQL

Si aún no tienes un servidor PostgreSQL configurado en tu máquina Ubuntu:

```bash
# Instalar PostgreSQL y contribuciones
sudo apt install -y postgresql postgresql-contrib

# Iniciar y habilitar el servicio para que arranque con el sistema
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Configurar Contraseña del Usuario `postgres`

Entra al prompt de PostgreSQL:
```bash
sudo -i -u postgres psql
```

Establece una contraseña segura para el usuario `postgres`:
```sql
ALTER USER postgres PASSWORD 'MiPasswordSeguroPrisma2026';
\q
```

---

## Paso 4: Preparar el Directorio del Proyecto

Recomendamos colocar el proyecto en `/var/www/pos-mat-monar`. 

1. Crea el directorio y otorga permisos a tu usuario actual (reemplaza `tu_usuario` por tu nombre de usuario en Ubuntu, por ejemplo, `ubuntu` o `root`):
```bash
sudo mkdir -p /var/www/pos-mat-monar
sudo chown -R $USER:$USER /var/www/pos-mat-monar
```

2. Clona el repositorio de Git en ese directorio o copia tus archivos directamente allí:
```bash
git clone <URL_DE_TU_REPOSITORIO> /var/www/pos-mat-monar
cd /var/www/pos-mat-monar
```

---

## Paso 5: Configurar las Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto para producción:

```bash
nano .env
```

Pega y edita el siguiente contenido (reemplaza los valores correspondientes):

```env
# URL de conexión a PostgreSQL
DATABASE_URL="postgresql://postgres:MiPasswordSeguroPrisma2026@localhost:5432/pos_dbMonar?schema=public"

# Puerto en el que escuchará la API (Node.js)
PORT=4002

# Clave secreta para firmar tokens JWT (usa una frase muy aleatoria y segura)
JWT_SECRET="MiClaveSecretaSuperDificilDeAdivinar2026!#"

# URL pública o IP de tu servidor (es la que usará el Frontend para consultar la API)
VITE_API_URL="http://192.168.1.141:4002"
```

> [!IMPORTANT]
> Asegúrate de que `VITE_API_URL` coincida con la IP del servidor o con el dominio que configurará el cliente. El puerto `4002` debe estar abierto si el frontend hace llamadas directas a este puerto, o si utilizas Nginx como proxy reverso completo (recomendado en el paso 7), puedes usar la dirección del dominio sin puerto.

---

## Paso 6: Ejecutar el Script de Despliegue Automático

Hemos creado un script que automatiza todo el proceso de instalación de dependencias, migración de base de datos, sembrado de catálogos e inicialización del frontend y backend.

1. Dale permisos de ejecución al script:
```bash
chmod +x deploy.sh
```

2. Ejecuta el script:
```bash
./deploy.sh
```

El script realizará las siguientes tareas:
* `npm install` de todas las dependencias.
* Creación de la base de datos `pos_dbMonar` (si no existe aún).
* Sincronización del esquema de base de datos de Prisma (`npx prisma db push`).
* Sembrado de datos iniciales (`setup-pos.js`, `seed-roles.js` y `seed-sat-catalogs.js`).
* Compilación estática del Frontend Vite en la carpeta `dist`.
* Arranque del servidor de API Node con PM2 y configuración para que arranque solo con el servidor Ubuntu.

---

## Paso 7: Configurar Nginx (Proxy Reverso y Frontend)

Nginx servirá los archivos HTML/JS del frontend directamente (máximo rendimiento) y redirigirá las consultas de `/api` y `/uploads` al backend que está corriendo en PM2 en el puerto `4002`.

1. Copia la plantilla de configuración de Nginx del proyecto a los sitios disponibles de Nginx:
```bash
sudo cp nginx-pos.conf /etc/nginx/sites-available/pos-monar
```

2. Abre el archivo para editarlo y ajusta tu dirección IP o dominio:
```bash
sudo nano /etc/nginx/sites-available/pos-monar
```
* Modifica la línea `server_name` colocando la IP de tu servidor (ej. `server_name 192.168.1.141;`) o tu dominio.
* Revisa que las rutas de `root` apuntes a `/var/www/pos-mat-monar/dist`.
* Revisa que las rutas de `alias` en `/uploads/` apunten a `/var/www/pos-mat-monar/public/uploads/`.

3. Habilita el sitio en Nginx y elimina el default si no lo utilizas:
```bash
sudo ln -s /etc/nginx/sites-available/pos-monar /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

4. Valida que la sintaxis de Nginx sea correcta:
```bash
sudo nginx -t
```

5. Si todo está correcto (`syntax is ok`, `test is successful`), reinicia Nginx:
```bash
sudo systemctl restart nginx
```

---

## Paso 8: Configurar HTTPS con SSL (Opcional pero Recomendado)

Si tienes un dominio apuntando a la IP de tu servidor, puedes instalar un certificado SSL gratuito con Let's Encrypt de forma muy sencilla:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

Sigue las instrucciones en pantalla. Certbot modificará automáticamente tu archivo de configuración de Nginx para habilitar HTTPS y redireccionar todo el tráfico HTTP a HTTPS de manera segura.

---

## 📈 Comandos Útiles de Mantenimiento

### Monitorear Backend (PM2)
* Ver logs en tiempo real: `pm2 logs`
* Ver estado de la aplicación: `pm2 status`
* Reiniciar la API backend: `pm2 restart pos-monar-backend`
* Detener la API backend: `pm2 stop pos-monar-backend`

### Actualizaciones Futuras de Código
Cuando hagas cambios en el código y quieras desplegar de nuevo en el servidor Ubuntu, solo debes ejecutar:
```bash
cd /var/www/pos-mat-monar
git pull
./deploy.sh
```
El script se encargará de reinstalar dependencias si las hay, aplicar cambios a la base de datos, compilar el nuevo frontend y reiniciar el backend sin caída de servicio.
