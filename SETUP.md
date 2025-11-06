# Setup Instructions - Conteo.online

## 🚀 Paso 1: Aplicar Schema en Supabase

Ya tienes el SQL Editor abierto en Supabase, ahora:

1. **Copia TODO el contenido** de `supabase/schema.sql`
2. **Pégalo** en el SQL Editor de Supabase
3. **Click en "Run"** (o Ctrl/Cmd + Enter)
4. Deberías ver: "Success. No rows returned" ✅

Esto creará:
- ✅ Tablas `sites` y `pageviews`
- ✅ Indexes optimizados
- ✅ RLS policies
- ✅ Helper functions para analytics

## 🔑 Paso 2: Obtener API Keys

En tu Supabase project:

1. Ve a **Settings** > **API** (en el sidebar)
2. Busca estas 3 valores:

   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (es seguro exponerlo)
   - **service_role key**: `eyJhbGc...` (⚠️ NUNCA expongas esto!)

## 📝 Paso 3: Crear .env.local

En la raíz del proyecto:

```bash
# Copia el template
cp .env.local.example .env.local

# Edita .env.local con tus keys reales
```

Tu `.env.local` debe verse así:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuprojectid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:**
- `.env.local` está en `.gitignore` (no se subirá a GitHub)
- `NEXT_PUBLIC_*` = pueden ir al cliente (tracking script)
- `SUPABASE_SERVICE_ROLE_KEY` = SOLO para API routes del servidor

## ✅ Paso 4: Verificar que funcionó

En Supabase SQL Editor, corre esto:

```sql
-- Debe devolver 2 tablas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sites', 'pageviews');

-- Debe devolver las 5 funciones
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'get_%';
```

Si ves las tablas y funciones, ¡estás listo! 🎉

## 🛠️ Próximos Pasos

Después de aplicar el schema:

1. ✅ Schema aplicado
2. ⬜ Crear tracking script (`public/tracker.js`)
3. ⬜ Crear API endpoint (`app/api/track/route.ts`)
4. ⬜ Crear dashboard básico
5. ⬜ Setup Auth con Supabase

---

**¿Dudas?** El archivo `supabase/README.md` tiene ejemplos de queries y más detalles.
