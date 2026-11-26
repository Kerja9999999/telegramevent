# ALB Carwash Telegram Bot

Existing car-wash functionality is retained. Temperature monitoring is added to the same Telegram bot.

## Existing environment variables
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- Existing AWOARA and admin/GitHub variables used by the current app

## Temperature monitoring environment variable
Set a long random secret in Render:
- `TEMP_API_TOKEN` — secret shared by the ESP32 and server
- Optional `TEMP_DEVICE_OFFLINE_MS` — offline timeout in milliseconds (default 120000)

## Telegram commands
- `/temperatura` — open temperature menu
- `/tempmin sensor1 5` — set sensor1 minimum to 5 °C
- `/tempmax sensor1 35` — set sensor1 maximum to 35 °C
- `/tempname sensor1 Тёплый пол` — rename a sensor

Use `sensor2` for the second sensor. Settings are changed in Telegram and do not require reflashing the ESP32.

## ESP32 API
Send a POST request to:

`https://YOUR-APP.onrender.com/api/temperature/readings`

Headers:
`Authorization: Bearer YOUR_TEMP_API_TOKEN`
`Content-Type: application/json`

Body example:
```json
{
  "deviceId": "esp32_1",
  "readings": {
    "sensor1": 23.5,
    "sensor2": 28.1
  }
}
```

Alternative body:
```json
{
  "deviceId": "esp32_1",
  "sensors": [
    { "id": "sensor1", "temperature": 23.5 },
    { "id": "sensor2", "temperature": 28.1 }
  ]
}
```

The server stores current readings, history, settings and all-time records in `data/temperature/`.
Alerts are sent for low/high temperature, return to normal, and ESP32 offline/reconnected status. Repeated out-of-range alerts are limited by a 15-minute cooldown.

## Important: Render storage
The app currently stores JSON files on its local filesystem. On Render, local files may be lost on redeploy/restart unless a persistent disk is configured and mounted at the app's data directory. Configure persistent storage before relying on long-term temperature history and records.
