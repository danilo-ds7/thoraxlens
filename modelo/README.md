# modelo/

Archivos que genera `notebooks/entrenamiento.ipynb` (ejecutar en Google Colab) y que la app necesita:

- `yolo_cls.pt` — pesos del modelo elegido (YOLO-cls nano, ≈3 MB)
- `clases.json` — orden, nombres, colores y descripciones de las 3 clases (ya incluido)
- `metricas.json` — métricas en prueba, matriz de confusión, umbral calibrado y comparación de modelos

Sin `yolo_cls.pt` y `metricas.json` el backend no arranca.
