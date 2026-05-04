FROM nginx:1.27-alpine

ENV PORT=10000

COPY public /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 10000

