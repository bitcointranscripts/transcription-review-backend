FROM nginx:latest
COPY nginx.conf /etc/nginx/nginx.conf
COPY dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
