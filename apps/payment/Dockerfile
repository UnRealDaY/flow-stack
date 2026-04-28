FROM php:8.3-fpm-alpine AS base

RUN apk add --no-cache \
    nginx \
    postgresql-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer*.json ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

COPY . .
RUN php artisan key:generate --force && php artisan config:cache

EXPOSE 8001
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8001"]
