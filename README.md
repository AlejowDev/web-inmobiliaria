# 🏡 Plataforma Inmobiliaria

Una plataforma digital robusta y escalable para la comercialización de proyectos inmobiliarios nuevos, desarrollada con tecnologías modernas como **Astro**, **Node.js** y **MySQL**. Diseñada para facilitar la compra, promoción y gestión de propiedades desde una experiencia 100% online.

---

## 🚀 Tecnologías Utilizadas

| Tecnología    | Descripción                                      |
|---------------|--------------------------------------------------|
| 🌠 **Astro**     | Framework moderno para sitios web rápidos y optimizados. |
| 🟢 **Node.js**   | Backend asincrónico para manejar la lógica del servidor. |
| 🐬 **MySQL**     | Base de datos relacional para almacenar información estructurada. |
| 🎨 **TailwindCSS** | Estilos modernos y responsivos. |

---

## 🧩 Funcionalidades Clave

### 🔍 Búsqueda Inteligente
- Búsqueda por ubicación, precio, entre otros.
- Filtros dinámicos que mejoran la experiencia del usuario.

### 🏗️ Gestión de Proyectos Inmobiliarios
- Registro de proyectos por constructora o agente.
- Información detallada: planos, renders, amenidades, ubicación, disponibilidad.

### 🧑‍💼 Gestión de Leads
- Captura de usuarios interesados en propiedades.
- Panel de administración para agentes y constructoras.

### 💬 Chat y Atención al Cliente
- Chat básico para conectar compradores con agentes o asesores.
- Integración futura con WhatsApp o chatbot automatizado.

---

## 🛠️ Instalación Local

```bash
# Clona el repositorio
git clone https://github.com/tuusuario/tu-repo-inmobiliaria.git

# Entra al directorio
cd tu-repo-inmobiliaria

# Instala dependencias del backend
cd backend
npm install

# Instala dependencias del frontend
cd ../frontend
npm install

# Crea base de datos y configura .env
# MySQL recomendado: crea una base de datos llamada `inmobiliaria`
cp .env.example .env

# Corre el backend
cd backend
npm run dev

# Corre el frontend
cd ../frontend
npm run dev
