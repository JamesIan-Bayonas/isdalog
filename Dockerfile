# 1. Use PHP 8.2 with FPM (FastCGI Process Manager)
FROM php:8.2-fpm

# 2. Set the working directory inside the container
WORKDIR /var/www

# 3. Install system dependencies for Laravel
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    locales \
    zip \
    jpegoptim optipng pngquant gifsicle \
    vim \
    unzip \
    git \
    curl \
    libzip-dev \
    libonig-dev

# 4. Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# 5. Install PHP extensions needed for MySQL and Laravel
RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install gd
RUN apk add --no-cache python3 make g++ 
RUN npm install --production

# 6. Install Composer (The PHP package manager)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 7. Copy your project files into the container
COPY . .

# 8. Set permissions so Laravel can write to logs and storage
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# 9. Start the PHP server
CMD ["php-fpm"]