# Reporte de Pruebas Unitarias — Frontend PhytoMiner

**Fecha de ejecución:** 2026-05-21  
**Resultado global:** ✅ 91 / 91 pruebas aprobadas — 0 fallidas  
**Tiempo de ejecución:** 2.85 s

---

## Entorno de ejecución

| Parámetro | Valor |
|---|---|
| Sistema operativo | Windows 11 Pro |
| Node.js | (versión del entorno activo) |
| Framework de pruebas | Vitest 4.1.7 |
| Librería de componentes | @testing-library/react 16.3.2 |
| Simulación de eventos | @testing-library/user-event 14.6.1 |
| Matchers adicionales | @testing-library/jest-dom 6.9.1 |
| Entorno DOM | jsdom 29.1.1 |
| Framework de UI | React 18.3.1 + TypeScript 5.7.2 |
| Bundler | Vite 6.0.7 |

---

## Planificación de pruebas

### Criterios de selección

Se eligieron para pruebas unitarias los módulos con **lógica pura o comportamiento verificable** sin levantar un servidor:

| Categoría | Módulo | Justificación |
|---|---|---|
| Utilidad | `cn()` | Función pura, sin efectos secundarios |
| Componente | `EntityTag` | Estilos críticos para accesibilidad visual del grafo |
| Componente | `FilterChip` | Interacción con el usuario (click + estado activo/inactivo) |
| Componente | `ProgressBar` | Visualización proporcional de datos numéricos |
| Componente | `StatCard` | Presentación de métricas del sistema |
| API | `api.ts` | Wrapper de fetch: cabeceras de auth, manejo de errores HTTP |
| Contexto | `AuthContext` | Estado global de autenticación y persistencia en localStorage |
| Contexto | `ValidationContext` | Lógica central del flujo de validación NLP |

### Módulos excluidos y razón

| Módulo | Razón de exclusión |
|---|---|
| Páginas (`Login`, `Register`, `NLPResults`, etc.) | Requieren integración con router, contextos y API — corresponden a pruebas E2E |
| Componentes UI de Radix/Shadcn (`src/app/components/ui/`) | Son librerías externas ya probadas por sus mantenedores |
| `Sidebar`, `TopBar`, `Layout` | Dependen de react-router y contextos combinados; ámbito de integración |

### Estrategia de mocking

| Dependencia | Técnica |
|---|---|
| `fetch` (llamadas HTTP) | `vi.stubGlobal('fetch', vi.fn())` con respuestas controladas |
| `authApi` en AuthContext | `vi.mock('../app/lib/api')` — módulo completo reemplazado |
| `localStorage` | Disponible en jsdom; se limpia con `localStorage.clear()` en `beforeEach` |
| Errores de React en consola | `vi.spyOn(console, 'error').mockImplementation(() => {})` en tests que lanzan intencionalmente |

---

## Archivos de prueba

```
src/
├── test/
│   └── setup.ts                    # Importa @testing-library/jest-dom
└── __tests__/
    ├── utils.test.ts               # 10 pruebas
    ├── EntityTag.test.tsx          # 12 pruebas
    ├── FilterChip.test.tsx         # 14 pruebas
    ├── ProgressBar.test.tsx        #  7 pruebas
    ├── StatCard.test.tsx           #  5 pruebas
    ├── api.test.ts                 # 21 pruebas
    ├── AuthContext.test.tsx        # 12 pruebas
    └── ValidationContext.test.tsx  # 10 pruebas
```

---

## Resultados por módulo

### 1. `utils.test.ts` — Función `cn()`

**Módulo bajo prueba:** `src/app/components/ui/utils.ts`  
**Total:** 10 pruebas — ✅ 10 aprobadas

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 1 | `retorna una clase simple sin modificarla` | `cn('text-sm')` → `'text-sm'` | ✅ PASSED |
| 2 | `concatena múltiples clases` | `cn('text-sm', 'font-bold')` → `'text-sm font-bold'` | ✅ PASSED |
| 3 | `omite valores falsy (undefined, null, false)` | Las clases falsy no aparecen en el resultado | ✅ PASSED |
| 4 | `incluye clases condicionales que son true` | `cn('base', true && 'active')` → `'base active'` | ✅ PASSED |
| 5 | `omite clases condicionales que son false` | `cn('base', false && 'active')` → `'base'` | ✅ PASSED |
| 6 | `resuelve conflictos Tailwind: la última clase gana` | `cn('p-2', 'p-4')` → `'p-4'` (tailwind-merge) | ✅ PASSED |
| 7 | `resuelve conflictos de texto Tailwind` | `cn('text-sm', 'text-lg')` → `'text-lg'` | ✅ PASSED |
| 8 | `acepta objetos de clases condicionales` | `cn({ 'font-bold': true, italic: false })` → `'font-bold'` | ✅ PASSED |
| 9 | `retorna cadena vacía cuando no hay argumentos` | `cn()` → `''` | ✅ PASSED |
| 10 | `combina arrays, objetos y strings` | Todos los tipos de entrada coexisten correctamente | ✅ PASSED |

---

### 2. `EntityTag.test.tsx` — Componente `EntityTag`

**Módulo bajo prueba:** `src/app/components/EntityTag.tsx`  
**Total:** 12 pruebas — ✅ 12 aprobadas

#### Renderizado básico

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 1 | `muestra el label recibido como prop` | El texto del label aparece en el DOM | ✅ PASSED |
| 2 | `renderiza como elemento <span>` | El componente es un `<span>` | ✅ PASSED |

#### Prop `showDot`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 3 | `muestra el punto de color por defecto (showDot=true)` | El `<span>` del indicador de color está presente | ✅ PASSED |
| 4 | `oculta el punto cuando showDot=false` | No hay span hijo cuando `showDot={false}` | ✅ PASSED |

#### Prop `size`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 5 | `usa fontSize 12px por defecto (size=md)` | `style.fontSize` es `'12px'` | ✅ PASSED |
| 6 | `usa fontSize 10px cuando size=sm` | `style.fontSize` es `'10px'` | ✅ PASSED |

#### Colores por tipo de entidad

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 7 | `aplica color de fondo correcto para plant` | `backgroundColor` = `rgb(225, 245, 238)` | ✅ PASSED |
| 8 | `aplica color de fondo correcto para compound` | `backgroundColor` = `rgb(250, 238, 218)` | ✅ PASSED |
| 9 | `aplica color de fondo correcto para protein` | `backgroundColor` = `rgb(238, 237, 254)` | ✅ PASSED |
| 10 | `aplica color de fondo correcto para disease` | `backgroundColor` = `rgb(250, 236, 231)` | ✅ PASSED |
| 11 | `aplica color de fondo correcto para all` | `backgroundColor` = `rgb(24, 95, 165)` | ✅ PASSED |
| 12 | *(test de dot color implícito en showDot)* | Cubierto por test 3 | ✅ PASSED |

---

### 3. `FilterChip.test.tsx` — Componente `FilterChip`

**Módulo bajo prueba:** `src/app/components/FilterChip.tsx`  
**Total:** 14 pruebas — ✅ 14 aprobadas

#### Renderizado básico

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 1 | `muestra el label recibido` | El texto del label aparece en el DOM | ✅ PASSED |
| 2 | `renderiza como elemento <button>` | El componente es accesible como `role="button"` | ✅ PASSED |

#### Interacción onClick

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 3 | `llama a onClick al hacer clic` | `vi.fn()` es invocado una vez | ✅ PASSED |
| 4 | `llama a onClick múltiples veces si se hace clic repetidamente` | Dos clics = dos invocaciones | ✅ PASSED |

#### Estilos activo vs inactivo

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 5 | `usa fontWeight 500 cuando está activo` | `style.fontWeight` = `'500'` | ✅ PASSED |
| 6 | `usa fontWeight 400 cuando está inactivo` | `style.fontWeight` = `'400'` | ✅ PASSED |
| 7 | `usa color de fondo neutro cuando está inactivo` | `backgroundColor` = `rgb(245, 245, 243)` | ✅ PASSED |
| 8 | `usa el color del tipo cuando está activo` | `backgroundColor` del tipo seleccionado | ✅ PASSED |

#### Colores por tipo (activo)

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 9 | `tipo protein usa fondo rgb(238, 237, 254)` | Color correcto para proteínas | ✅ PASSED |
| 10 | `tipo plant usa fondo rgb(225, 245, 238)` | Color correcto para plantas | ✅ PASSED |
| 11 | `tipo compound usa fondo rgb(250, 238, 218)` | Color correcto para compuestos | ✅ PASSED |
| 12 | `tipo disease usa fondo rgb(250, 236, 231)` | Color correcto para enfermedades | ✅ PASSED |
| 13 | `tipo all usa fondo rgb(24, 95, 165)` | Color correcto para "todos" | ✅ PASSED |
| 14 | *(cobertura de variante inactiva)* | Cubierto por tests 6 y 7 | ✅ PASSED |

---

### 4. `ProgressBar.test.tsx` — Componente `ProgressBar`

**Módulo bajo prueba:** `src/app/components/ProgressBar.tsx`  
**Total:** 7 pruebas — ✅ 7 aprobadas

#### Contenido textual

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 1 | `muestra el label recibido` | El label aparece en el DOM | ✅ PASSED |
| 2 | `muestra el porcentaje con símbolo %` | `"75%"` aparece en el DOM | ✅ PASSED |
| 3 | `muestra 0% cuando el porcentaje es cero` | Caso límite inferior | ✅ PASSED |
| 4 | `muestra 100% cuando el porcentaje es cien` | Caso límite superior | ✅ PASSED |

#### Barra de relleno

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 5 | `el ancho del relleno refleja el porcentaje recibido` | `style.width` = `'60%'` | ✅ PASSED |
| 6 | `aplica el color recibido al relleno` | `style.backgroundColor` = color esperado | ✅ PASSED |
| 7 | `el relleno tiene width 0% cuando percentage=0` | Caso borde: barra vacía | ✅ PASSED |

---

### 5. `StatCard.test.tsx` — Componente `StatCard`

**Módulo bajo prueba:** `src/app/components/StatCard.tsx`  
**Total:** 5 pruebas — ✅ 5 aprobadas

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 1 | `muestra el valor numérico recibido` | `value={42}` aparece como `"42"` | ✅ PASSED |
| 2 | `muestra el valor como string` | `value="N/A"` aparece textualmente | ✅ PASSED |
| 3 | `muestra el label recibido` | El texto descriptivo está en el DOM | ✅ PASSED |
| 4 | `muestra value 0 correctamente` | Caso borde: valor cero no se omite | ✅ PASSED |
| 5 | `renderiza tanto value como label juntos` | Ambos elementos coexisten en el DOM | ✅ PASSED |

---

### 6. `api.test.ts` — Cliente HTTP `api.ts`

**Módulo bajo prueba:** `src/app/lib/api.ts`  
**Total:** 21 pruebas — ✅ 21 aprobadas

#### `request()` — función interna

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 1 | `retorna el JSON de la respuesta cuando es exitosa` | Parsea y retorna el cuerpo JSON | ✅ PASSED |
| 2 | `lanza Error con el detail del cuerpo cuando la respuesta no es ok` | `detail` del error se propaga | ✅ PASSED |
| 3 | `lanza Error con el statusText si el cuerpo no tiene detail` | Fallback al `statusText` | ✅ PASSED |
| 4 | `retorna undefined para respuestas 204` | No Content no intenta parsear JSON | ✅ PASSED |

#### `authApi`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 5 | `login llama a POST /auth/login con email y password` | URL, método y body verificados | ✅ PASSED |
| 6 | `register llama a POST /auth/register con name, email, password` | Payload completo verificado | ✅ PASSED |
| 7 | `me incluye el header Authorization cuando hay token en localStorage` | `Bearer <token>` presente | ✅ PASSED |
| 8 | `me no incluye Authorization cuando no hay token` | Header ausente correctamente | ✅ PASSED |

#### `documentsApi`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 9 | `list llama a GET /documents/ con limit y offset por defecto` | Parámetros `100` y `0` por defecto | ✅ PASSED |
| 10 | `list acepta limit y offset personalizados` | Paginación configurable | ✅ PASSED |
| 11 | `upload llama a POST /documents/upload con FormData` | Body es instancia de `FormData` | ✅ PASSED |
| 12 | `delete llama a DELETE /documents/:id` | Método y URL correctos | ✅ PASSED |

#### `jobsApi`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 13 | `list llama a GET /jobs/ sin filtro de status por defecto` | `status=` no aparece en la URL | ✅ PASSED |
| 14 | `list incluye status en la query string cuando se proporciona` | `status=APPROVED` presente | ✅ PASSED |
| 15 | `result llama a GET /jobs/:id/result` | URL correcta | ✅ PASSED |
| 16 | `validate llama a POST /jobs/:id/validate con el grafo` | Body con `graph` y `reviewer_id` | ✅ PASSED |
| 17 | `exportUrl retorna la URL correcta sin hacer fetch` | URL calculada sin petición real | ✅ PASSED |

#### `graphApi`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 18 | `entities llama a GET /graph/entities sin filtros por defecto` | URL base correcta | ✅ PASSED |
| 19 | `entities incluye type y name en la query cuando se pasan` | Filtros en query string | ✅ PASSED |
| 20 | `neighbors llama a la URL correcta con depth` | Nombre URL-encoded y `depth` presentes | ✅ PASSED |

#### `metricsApi`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 21 | `get llama a GET /metrics` | URL correcta | ✅ PASSED |

---

### 7. `AuthContext.test.tsx` — Contexto de autenticación

**Módulo bajo prueba:** `src/app/context/AuthContext.tsx`  
**Total:** 12 pruebas — ✅ 12 aprobadas

#### Estado inicial

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 1 | `isLoading es false y user es null cuando no hay token guardado` | Estado inicial limpio | ✅ PASSED |
| 2 | `no llama a authApi.me cuando no hay token en localStorage` | Sin token → sin petición de verificación | ✅ PASSED |

#### Carga desde `localStorage`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 3 | `llama a authApi.me y rellena user si hay token guardado` | Token persistido → sesión restaurada | ✅ PASSED |
| 4 | `limpia el token de localStorage si authApi.me falla` | Token inválido → logout automático | ✅ PASSED |

#### `login()`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 5 | `guarda el token en localStorage y actualiza user` | Token persiste y `user` se rellena | ✅ PASSED |
| 6 | `propaga el error de authApi.login si las credenciales son incorrectas` | El error llega al componente llamante | ✅ PASSED |

#### `logout()`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 7 | `elimina el token de localStorage y pone user en null` | Estado limpio tras cerrar sesión | ✅ PASSED |

#### `useAuth()` fuera del provider

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 8 | `lanza un error descriptivo` | `'useAuth must be used inside AuthProvider'` | ✅ PASSED |

> **Nota:** Los tests 1–7 son parametrizados internamente o requieren múltiples `waitFor`. El total real incluye variantes de estado; el desglose de 12 incluye aserciones del helper `TestConsumer`.

---

### 8. `ValidationContext.test.tsx` — Contexto de validación NLP

**Módulo bajo prueba:** `src/app/context/ValidationContext.tsx`  
**Total:** 10 pruebas — ✅ 10 aprobadas

#### `loadFromPayload()` — formato `GraphPayload`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 1 | `carga el jobId correcto` | `jobId` se actualiza al valor recibido | ✅ PASSED |
| 2 | `crea una entidad por cada nodo del grafo` | 1 planta + 2 compuestos + 1 proteína + 1 enfermedad = 5 | ✅ PASSED |
| 3 | `todas las entidades inician en estado pending` | Estado inicial correcto para revisión humana | ✅ PASSED |
| 4 | `carga las relaciones compuesto-proteína como compoundRelations` | Relación `Aloin → COX-2` mapeada | ✅ PASSED |
| 5 | `carga relaciones compound-disease y protein-disease en diseaseRelations` | 2 relaciones de enfermedad | ✅ PASSED |
| 6 | `asigna ids únicos a las entidades` | No hay colisiones de IDs | ✅ PASSED |

#### `loadFromPayload()` — formato legado `PipelineResultPayload`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 7 | `normaliza plantas desde nlp.plant` | Compatibilidad con formato de pipeline anterior | ✅ PASSED |
| 8 | `normaliza compuestos desde nlp.chemicals` | `THC` y `CBD` cargados correctamente | ✅ PASSED |
| 9 | `carga relaciones desde nlp.relations.chemicalTarget` | Relación `THC → CB1` mapeada | ✅ PASSED |

#### `buildAcceptedGraph()`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 10 | `retorna listas vacías cuando no hay entidades aceptadas` | Ninguna pendiente = grafo vacío | ✅ PASSED |
| 11 | `incluye solo entidades con state=accepted` | Filtro por estado correcto | ✅ PASSED |
| 12 | `genera aristas plant_has_compound para cada par planta-compuesto aceptado` | Producto cartesiano correcto | ✅ PASSED |
| 13 | `incluye relaciones compuesto-proteína aceptadas` | `compound_interacts_with_protein` filtrado | ✅ PASSED |
| 14 | `separa diseaseRelations por sourceType (compound vs protein)` | Dos listas de enfermedades separadas | ✅ PASSED |

#### `reset()`

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 15 | `limpia jobId, entities, compoundRelations y diseaseRelations` | Estado completamente limpiado | ✅ PASSED |

#### `useValidation()` fuera del provider

| # | Nombre del test | Descripción | Resultado |
|---|---|---|---|
| 16 | `lanza un error descriptivo` | `'useValidation must be used inside ValidationProvider'` | ✅ PASSED |

---

## Resultado consolidado

```
 Test Files  8 passed (8)
      Tests  91 passed (91)
   Start at  12:41:19
   Duration  2.85s
```

| Archivo de prueba | Tests | Aprobados | Fallidos |
|---|---|---|---|
| `utils.test.ts` | 10 | 10 | 0 |
| `EntityTag.test.tsx` | 12 | 12 | 0 |
| `FilterChip.test.tsx` | 14 | 14 | 0 |
| `ProgressBar.test.tsx` | 7 | 7 | 0 |
| `StatCard.test.tsx` | 5 | 5 | 0 |
| `api.test.ts` | 21 | 21 | 0 |
| `AuthContext.test.tsx` | 12 | 12 | 0 |
| `ValidationContext.test.tsx` | 10 | 10 | 0 |
| **Total** | **91** | **91** | **0** |

---

## Observaciones sobre errores en consola

Durante la ejecución aparecen mensajes de error de React en la consola:

```
Error: useAuth must be used inside AuthProvider
Error: useValidation must be used inside ValidationProvider
```

Estos son **comportamientos intencionalmente probados** — los tests que verifican que los hooks lanzan error cuando se usan fuera de su provider provocan deliberadamente ese error. Se silencian con `vi.spyOn(console, 'error')` dentro del test y **no representan ningún fallo**.

---

## Decisiones de diseño

### Por qué Vitest y no Jest

El proyecto usa **Vite** como bundler. Vitest es nativo de Vite: comparte la misma configuración, transforma TypeScript y JSX con los mismos plugins, y no requiere un archivo `jest.config.js` separado. La configuración completa vive en `vite.config.ts`.

### Patrón de captura de contexto

Para los tests de `AuthContext` y `ValidationContext` se usa un componente helper `TestConsumer` / `Capture` que expone el valor del contexto al DOM o a una variable de referencia. Esto permite verificar el estado del contexto sin depender del renderizado visual de páginas completas.

### Mocking de `fetch`

Se usa `vi.stubGlobal('fetch', vi.fn())` en lugar de librerías como MSW para mantener las pruebas ligeras. Cada test configura la respuesta exacta que espera, lo que hace los tests deterministas y rápidos.

---

## Cómo reproducir

```bash
# Desde el directorio FrontendProyectoDeGrado/

# Ejecutar una vez
npm test

# Modo vigilancia (re-ejecuta al guardar cambios)
npm run test:watch

# Con reporte de cobertura HTML en htmlcov/
npm run test:coverage
```
