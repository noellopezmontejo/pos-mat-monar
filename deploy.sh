#!/bin/bash

# --- Configuración de Estilo ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   DESPLIEGUE EN PRODUCCIÓN - POS MAT MONAR       ${NC}"
echo -e "${BLUE}==================================================${NC}"

# 1. Verificar variables de entorno
if [ ! -f .env ]; then
    echo -e "${RED}[ERROR] El archivo .env no existe en el directorio raíz.${NC}"
    echo -e "${YELLOW}Por favor, crea el archivo .env basándote en .env.production o configura DATABASE_URL y PORT.${NC}"
    exit 1
fi

# 2. Descargar últimos cambios (opcional - descomenta si usas git en el servidor)
# echo -e "${YELLOW}[1/6] Obteniendo últimos cambios de Git...${NC}"
# git pull

# 3. Instalar dependencias
echo -e "${YELLOW}[2/6] Instalando dependencias de Node.js...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Falló la instalación de dependencias (npm install).${NC}"
    exit 1
fi

# 4. Generar Cliente Prisma y Sincronizar Base de Datos
echo -e "${YELLOW}[3/6] Configurando base de datos con Prisma...${NC}"
npx prisma generate

# Crear la base de datos si no existe
node scripts/create-db.js

# Sincronizar esquema de Prisma en la Base de Datos
echo -e "${YELLOW}Sincronizando esquema de base de datos...${NC}"
npx prisma db push
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Falló la sincronización del esquema (prisma db push).${NC}"
    exit 1
fi

# Sembrar datos iniciales (Sucursal, Cliente Público, Roles, Catálogos SAT)
echo -e "${YELLOW}Sembrando datos iniciales en la base de datos...${NC}"
node scripts/setup-pos.js
node scripts/seed-roles.js
node scripts/seed-sat-catalogs.js

# 5. Compilar frontend de producción (Vite)
echo -e "${YELLOW}[4/6] Compilando el Frontend de producción (Vite)...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Falló la compilación del Frontend (npm run build).${NC}"
    exit 1
fi

# 6. Iniciar/Reiniciar el Backend con PM2
echo -e "${YELLOW}[5/6] Iniciando/Actualizando proceso Backend con PM2...${NC}"
if pm2 describe pos-monar-backend > /dev/null 2>&1; then
    echo -e "${GREEN}Reiniciando servicio backend existente...${NC}"
    pm2 reload ecosystem.config.js --env production
else
    echo -e "${GREEN}Iniciando nuevo servicio backend...${NC}"
    pm2 start ecosystem.config.js --env production
fi

# Guardar lista de PM2 para persistencia ante reinicios del servidor
pm2 save

echo -e "${YELLOW}[6/6] Configurando persistencia de PM2 ante reinicios del sistema...${NC}"
# Habilita el inicio automático de PM2 en el arranque del sistema (si no se ha hecho antes)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}¡Despliegue finalizado exitosamente!${NC}"
echo -e "Backend escuchando en el puerto ${GREEN}4002${NC}."
echo -e "Los archivos estáticos del Frontend están en ${GREEN}$(pwd)/dist${NC}."
echo -e "${BLUE}==================================================${NC}"
