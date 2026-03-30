# IsdaLog: Maritime Catch & Logistics Engine

## System Overview
IsdaLog is the core logistics, financial, and regulatory backend engine for the Fisheries AI ecosystem. Built on Laravel, it operates as a secure REST API that ingests geospatial catch data, processes market valuations, and enforces local maritime regulations. 

This repository represents the backend infrastructure. It is designed to be highly decoupled, allowing various frontends to submit data to the logistics engine.

## Ecosystem Dependency & Architecture
The IsdaLog engine is half of a microservice architecture. 

* **The Client (Data Ingestion):** In a production environment, this API is consumed by the [Fisheries AI](https://github.com/JamesIan-Bayonas/fisheries-ai.git) service—a Node.js Telegram bot equipped with an Edge-AI vision model (LLaVA). The bot identifies the fish species in the field and securely transmits the structured JSON payload to this IsdaLog API.
* **The Engine (Data Processing):** Once IsdaLog receives the payload, it cross-references the species against the `market_prices` table to calculate economic value, checks the `restricted_species` table for Bureau of Fisheries and Aquatic Resources (BFAR) compliance, and persists the data to MySQL.

## Employer Evaluation Guide (Fast-Track Testing)
Evaluating the full ecosystem requires configuring Telegram bot tokens and a local GPU for AI vision inference. To respect your time, you can bypass the AI frontend and directly evaluate the backend logic by simulating the bot's HTTP request.

Ensure the Docker containers are running, then execute the following POST request in your terminal to observe the financial and regulatory engine in action:

```bash
curl -X POST http://localhost:8000/api/catch \
-H "Content-Type: application/json" \
-H "Accept: application/json" \
-d '{
  "telegram_id": "123456789",
  "species": "Red Snapper",
  "weight": 1.5,
  "latitude": 8.5869,
  "longitude": 123.3406
}'
```
```json
Expected JSON Response:
The API will dynamically calculate the 1.5kg weight against the local market rate and return the enriched data:

{
  "message": "Catch logged successfully",
  "estimated_value": 675.00,
  "warning_flag": null
}
```

(Note: Try changing the species to "Sea Turtle" to observe the automated BFAR restriction flag).
Technical Stack

* Framework: Laravel 11.x
* Language: PHP 8.2+
* Database: MySQL 8.0
* API Security: Laravel Sanctum
* Infrastructure: Docker (Laravel Sail)

## Local Development & Installation

This application is fully containerized to ensure identical environments across all deployment stages.
1. Clone the repository:

```bash
git clone [https://github.com/JamesIan-Bayonas/isdalog.git](https://github.com/JamesIan-Bayonas/isdalog.git)
cd isdalog
```

2. Install PHP dependencies using a temporary Composer container:

```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php82-composer:latest \
    composer install --ignore-platform-reqs
```

3. Configure the environment:
```bash 
cp .env.example .env
```

4. Boot the Docker ecosystem:

```bash
./vendor/bin/sail up -d
```

5. Generate the application key, run database migrations, and inject the regional market seed data:

```bash 
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate:fresh --seed
```

# Future Roadmap
Implementation of a React-based web dashboard for historical catch visualization.
Integration of weather and tidal data directly into the database schemas for predictive catch modeling.
