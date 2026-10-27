# 🫁 ThoraxLens — Clasificador educativo de tomografías de tórax (cáncer de pulmón)

> **Prototipo educativo. No es un diagnóstico médico.** Ningún resultado de esta app reemplaza la evaluación de un profesional de salud.

**UDD · IA para la Gestión Industrial** · Réplica de [NeuroLens](https://github.com/OrtegaMatias/neurolens) (tumores cerebrales en RM) aplicada a tomografías computarizadas (TC) de tórax.

| | |
|---|---|
| 🌐 App | https://thoraxlens.cvdi.cl *(pendiente de publicar en la VM; ver sección 7)* |
| 💻 Repositorio | https://github.com/danilo-ds7/thoraxlens |
| 👤 Autor | Danilo Gómez Correa |

ThoraxLens recibe un corte axial de TC de tórax, lo clasifica en **normal, benigno o maligno**, muestra la confianza, las probabilidades de las 3 clases y un mapa **Grad-CAM** de dónde miró el modelo, y pide a un LLM (**Claude Haiku 5.5**, de Anthropic) una recomendación educativa en lenguaje simple. Incluye un mini juego **Humano vs IA** que explica por qué falló cada uno.

```
📷 Imagen → 🫁 YOLO-cls nano (clase + confianza + Grad-CAM) → 📊 Resultado visual → 💬 Claude Haiku → ✅ Recomendación
```

## 1. Problema y motivación

El cáncer de pulmón es uno de los cánceres más frecuentes y letales; detectarlo temprano cambia el pronóstico. La lectura de TC de tórax depende de radiólogos escasos. Un clasificador automático podría apoyar el **triaje** (priorizar qué estudios revisar primero). Este proyecto es un prototipo **educativo** que muestra ese flujo de punta a punta, sus métricas y, sobre todo, sus **límites**.

## 2. Datos (ficha)

| Aspecto | Detalle |
|---|---|
| Dataset | *The IQ-OTH/NCCD lung cancer dataset* — Alyasriy & AL-Huseiny (Iraq-Oncology Teaching Hospital / National Center for Cancer Diseases) |
| Enlace | https://www.kaggle.com/datasets/hamdallak/the-iqothnccd-lung-cancer-dataset (espejo: https://data.mendeley.com/datasets/bhmdr45bh2) |
| Licencia | CC BY 4.0 |
| Origen | TC de tórax de 110 pacientes recolectadas en dos centros de Irak (otoño 2019); escáner Siemens SOMATOM, 120 kV, cortes de 1 mm |
| Formato | JPG (convertido desde DICOM), escala de grises, cortes axiales |
| Clases | `benign` · `malignant` · `normal` |
| Original | ≈ 1.100–1.200 cortes: 55 casos normales, 40 malignos y 15 benignos |

**Cómo dividimos:** 1.097 imágenes originales; se eliminan duplicados exactos (hash MD5) y se hace una división estratificada 70/15/15 con semilla 42 → **737 train / 158 val / 159 test**.

**Desbalance fuerte:** *benigno* es ~10 % del total; por eso la métrica principal es la **accuracy balanceada** (azar = 33 %) y se mira el recall de cada clase por separado.

**Limitaciones:** varios cortes por paciente sin identificador (cortes vecinos del mismo paciente quedan en train y test → la métrica es **muy optimista**); solo 110 pacientes, un escáner y dos centros de un solo país; un corte aislado no equivale a un examen completo.

El dataset **no se sube** al repositorio: el notebook lo descarga con `kagglehub`.

## 3. Modelo y comparación

Los tres enfoques se evalúan con **la misma métrica sobre el mismo conjunto de prueba**:

| Enfoque | Accuracy balanceada | Falsos negativos* | Tamaño | ms/imagen (CPU) |
|---|---|---|---|---|
| CLIP ViT-B/32 zero-shot (línea base) | 43,1 % | 58 | 605 MB | 573 |
| **EfficientNet-B0 (`timm`, transfer learning)** | **94,7 %** | **0** | 16,3 MB | 35 |
| YOLO-cls nano (`ultralytics`) — en la app | 84,3 % | 0 | 3,2 MB | 17 |

\* corte maligno clasificado como "normal" o "benigno", de 82 malignos en prueba.

**Resultado honesto:** en este dataset **EfficientNet-B0 rinde mejor** que YOLO-cls nano en la métrica principal (+10 puntos de accuracy balanceada); ambos detectan el 100 % de los malignos. La diferencia está en la clase *benigno* (solo 16 imágenes de prueba): YOLO acierta 9/16, EfficientNet más. La app usa YOLO-cls nano porque el backend y el Grad-CAM están construidos sobre esa arquitectura y es 5× más liviano y 2× más rápido en CPU; **mejora pendiente:** migrar el backend a EfficientNet o reentrenar YOLO con más épocas y pesos de clase para subir el recall de *benigno*.

**Métricas de YOLO-cls nano en prueba (159 imágenes):** accuracy 94,3 % · accuracy balanceada 84,3 % · recall benigno 56 % / maligno 100 % / normal 97 % · sensibilidad "es maligno" 100 % · especificidad 100 %.

**Error más costoso:** 0 de 82 cortes malignos se clasificaron como normal o benigno. Aun así la app nunca "descarta": siempre recomienda revisión profesional.

**Umbral de confianza:** calibrado en **validación** (menor umbral con ≥ 99 % de acierto sobre él) → **67 %**. Bajo ese valor la app pide revisión humana.

## 4. Arquitectura

```
navegador ──HTTPS──▶ Cloudflare Tunnel (thoraxlens.cvdi.cl)
                         └─▶ web  (Next.js 16 + Tailwind + Framer Motion)   docker compose "thoraxlens"
                               └─ /api/* ─▶ api (FastAPI + YOLO + Grad-CAM) ──▶ API de Anthropic
```

Frontend y backend corren en una VM propia con `docker compose` (proyecto, red e imágenes aisladas; límites de RAM/CPU). El navegador solo ve el frontend; Next.js reenvía `/api/*` al backend por la red interna de Docker. El puerto `127.0.0.1:8091` queda solo en localhost; Cloudflare Tunnel lo publica.

| Endpoint | Qué hace |
|---|---|
| `POST /api/acceso` | valida la clave y entrega una cookie de sesión con IA generativa (12 h) |
| `GET /api/info` | clases, umbral y métricas de prueba |
| `POST /api/predict` | imagen → clase, confianza, probabilidades, aviso de baja confianza y Grad-CAM |
| `POST /api/recomendar` | resultado → recomendación educativa de Claude (streaming) |
| `POST /api/explicar-desafio` | ronda del juego → explicación de Claude de por qué falló cada uno |

**Dos niveles de acceso.** Cualquiera puede **entrar como invitado** y usar la clasificación, el Grad-CAM, las métricas y el juego Humano vs IA. La **IA generativa** (Claude), que es lo que tiene costo, requiere una **clave rotativa**: vive en un archivo del servidor (`acceso/clave`, permisos 600), solo se obtiene por SSH y un cron la cambia cada día (`scripts/rotar-clave.sh`). Al ingresarla, el backend entrega una cookie HttpOnly firmada con HMAC usando la clave vigente; al rotar, esas sesiones vencen. Los endpoints del LLM responden 401 sin esa sesión y hay límite de 5 intentos fallidos cada 10 minutos por IP.

## 5. IA generativa responsable

- Al LLM se envía **solo texto** (clase, confianza, probabilidades, umbral); nunca la imagen.
- El *system prompt* limita el tema, exige aclarar que **no es un diagnóstico**, prohíbe tratamientos/fármacos/pronósticos, pide **revisión humana si la confianza está bajo el umbral** o si la segunda clase está cerca, y recuerda que un "normal" o "benigno" no descarta nada si hay síntomas o factores de riesgo.
- La clave `ANTHROPIC_API_KEY` vive solo en el archivo `.env` del servidor (ignorado por git) y **nunca** se sube al repositorio. Todos los endpoints del LLM exigen sesión.

## 6. Estructura del repositorio

```
├── app.py                     ← API FastAPI (modelo + Grad-CAM + Claude)
├── requirements.txt           ← dependencias de la app
├── requirements-notebook.txt  ← extras para el notebook
├── Dockerfile                 ← imagen del backend
├── docker-compose.yml         ← despliegue aislado (api + web)
├── scripts/rotar-clave.sh     ← genera/rota la clave de acceso
├── notebooks/entrenamiento.ipynb  ← datos, comparación de modelos y métricas (ejecutar en Colab)
├── modelo/                    ← yolo_cls.pt (3 MB), clases.json, metricas.json
├── ejemplos/                  ← 3 imágenes de prueba (una por clase)
└── web/                       ← frontend Next.js (con su Dockerfile)
```

## 7. Cómo ejecutar

### Paso 1 · Entrenar en Google Colab

1. Abrir `notebooks/entrenamiento.ipynb` en Colab con GPU (T4).
2. Ejecutar todas las celdas (≈15–25 min). `kagglehub` descarga el dataset solo; si pide credenciales, cargar el `kaggle.json` de tu cuenta.
3. Descargar desde Colab y copiar al repositorio:
   - `/content/modelo/yolo_cls.pt` y `/content/modelo/metricas.json` → `modelo/`
   - `/content/ejemplos/*.jpg` → `ejemplos/`
   - `/content/web/public/ejemplos/` (3 ejemplos + carpeta `desafio/` + `desafio.json`) → `web/public/ejemplos/`
4. Completar la tabla de la sección 3 con los números impresos en el notebook (ya hecho para la ejecución del 27-10-2026).

### Paso 2 · Desplegar en la VM

```bash
git clone https://github.com/danilo-ds7/thoraxlens && cd thoraxlens
echo 'ANTHROPIC_API_KEY=tu_clave' > .env
scripts/rotar-clave.sh                     # imprime la clave de acceso
docker compose up -d --build               # → http://127.0.0.1:8091
```

Cloudflare Tunnel: agregar en el `config.yml` del túnel existente un ingress `thoraxlens.cvdi.cl → http://localhost:8091` y crear el registro DNS (`cloudflared tunnel route dns <tunel> thoraxlens.cvdi.cl`).

Rotación diaria de la clave: `crontab -e` → `0 5 * * * $HOME/thoraxlens/scripts/rotar-clave.sh >/dev/null`.

### Sin Docker (desarrollo)

```bash
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
uvicorn app:app --port 7860 --env-file .env
cd web && pnpm install && API_INTERNA_URL=http://localhost:7860 pnpm dev
```

## 8. Uso de herramientas de IA (declaración)

| Herramienta | Uso |
|---|---|
| Claude (Anthropic), asistente de código | Adaptar el código de NeuroLens (notebook, `app.py`, frontend Next.js) al nuevo dataset y dominio; redactar borradores de textos. |
| Claude Haiku 5.5 (Anthropic) | Modelo de lenguaje **dentro de la app** que genera las recomendaciones y las explicaciones del juego. |

## 9. Ética

Dataset público con licencia CC BY 4.0 y sin datos identificables. La app indica de forma visible que es educativa y que no diagnostica. El modelo tiene sesgos de fuente y población (ver Limitaciones), la métrica es optimista por la falta de división por paciente, y siempre elegirá una de sus 3 clases, incluso ante imágenes que no son tomografías.
