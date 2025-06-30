ARG BASE=node:20.18.0
FROM ${BASE} AS base

WORKDIR /app

# 1) Instala dependencias
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# 2) Copia el resto del código
COPY . .

# 3) Asegúrate de que package.json esté en public/
#    (crea public/ si no existe y copia el package.json dentro)
RUN mkdir -p public && cp package.json public/package.json

# Exponemos el puerto (sólo informativo en la etapa base)
EXPOSE 5173

# Producción
FROM base AS bolt-ai-production

# Define environment variables with default values or let them be overridden
ARG GROQ_API_KEY
ARG HUGGINGFACE_API_KEY
ARG OPENAI_API_KEY
ARG ANTHROPIC_API_KEY
ARG OPEN_ROUTER_API_KEY
ARG GOOGLE_GENERATIVE_AI_API_KEY
ARG OLLAMA_API_BASE_URL
ARG XAI_API_KEY
ARG TOGETHER_API_KEY
ARG TOGETHER_API_BASE_URL
ARG AWS_BEDROCK_CONFIG
ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX

ENV WRANGLER_SEND_METRICS=false \
    GROQ_API_KEY=${GROQ_API_KEY} \
    HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY} \
    OPENAI_API_KEY=${OPENAI_API_KEY} \
    ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY} \
    OPEN_ROUTER_API_KEY=${OPEN_ROUTER_API_KEY} \
    GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY} \
    OLLAMA_API_BASE_URL=${OLLAMA_API_BASE_URL} \
    XAI_API_KEY=${XAI_API_KEY} \
    TOGETHER_API_KEY=${TOGETHER_API_KEY} \
    TOGETHER_API_BASE_URL=${TOGETHER_API_BASE_URL} \
    AWS_BEDROCK_CONFIG=${AWS_BEDROCK_CONFIG} \
    VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX}\
    RUNNING_IN_DOCKER=true

# Pre-configuración de wrangler…
RUN mkdir -p /root/.config/.wrangler && \
    echo '{"enabled":false}' > /root/.config/.wrangler/metrics.json

# 4) Ahora el build verá public/package.json y lo copiará a build/client
RUN pnpm run build

CMD [ "pnpm", "run", "dockerstart" ]

# Desarrollo
FROM base AS bolt-ai-development

# Define the same environment variables for development
ARG GROQ_API_KEY
ARG HuggingFace 
ARG OPENAI_API_KEY
ARG ANTHROPIC_API_KEY
ARG OPEN_ROUTER_API_KEY
ARG GOOGLE_GENERATIVE_AI_API_KEY
ARG OLLAMA_API_BASE_URL
ARG XAI_API_KEY
ARG TOGETHER_API_KEY
ARG TOGETHER_API_BASE_URL
ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX

ENV GROQ_API_KEY=${GROQ_API_KEY} \
    HuggingFace_API_KEY=${HuggingFace_API_KEY} \
    OPENAI_API_KEY=${OPENAI_API_KEY} \
    ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY} \
    OPEN_ROUTER_API_KEY=${OPEN_ROUTER_API_KEY} \
    GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY} \
    OLLAMA_API_BASE_URL=${OLLAMA_API_BASE_URL} \
    XAI_API_KEY=${XAI_API_KEY} \
    TOGETHER_API_KEY=${TOGETHER_API_KEY} \
    TOGETHER_API_BASE_URL=${TOGETHER_API_BASE_URL} \
    AWS_BEDROCK_CONFIG=${AWS_BEDROCK_CONFIG} \
    VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX}\
    RUNNING_IN_DOCKER=true

RUN mkdir -p ${WORKDIR}/run
CMD pnpm run dev --host


# -----------------
# Etapa de PREVIEW
# -----------------
FROM bolt-ai-production AS bolt-ai-preview

# Exponemos el puerto para preview
EXPOSE 5173

# Arrancamos el build ya generado con el script de preview
CMD ["pnpm","run","preview"]
