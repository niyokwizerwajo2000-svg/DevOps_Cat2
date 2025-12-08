FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Copy prebuilt static files (frontend/dist) into nginx www root.
# If you want to rebuild assets inside Docker, change this to a multi-stage build.
COPY frontend/dist/ /usr/share/nginx/html/
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
