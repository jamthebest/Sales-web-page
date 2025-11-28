# Imagen oficial de Python
FROM python:3.11-slim

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Exponer el puerto para Cloud Run
EXPOSE 8080

# Comando de ejecución
CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8080"]
