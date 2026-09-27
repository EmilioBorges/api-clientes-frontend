# Usa a imagem oficial do Nginx baseada em Alpine (muito leve)
FROM nginx:alpine

# Remove os arquivos padrão do Nginx (página de boas-vindas)
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos do nosso frontend para a pasta pública do Nginx
COPY . /usr/share/nginx/html

# Expõe a porta padrão HTTP
EXPOSE 80

# Inicia o Nginx e o mantém rodando em primeiro plano
CMD ["nginx", "-g", "daemon off;"]