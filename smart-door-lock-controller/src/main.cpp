#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <IotWebConf.h>
#include <Servo.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WiFiMulti.h>

#if ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(4, 4, 0)
#include <sha/sha_parallel_engine.h>
#else
#include <hwcrypto/sha.h>
#endif

#if __has_include("secrets.h")
#include "secrets.h"
#else
#include "secrets_default.h"
#endif

#include "cert.h"
#include "urlencode.h"

#define POLL_DELAY 1000
#define ECHO_DELAY 100
#define MOTION_DEBOUNCE_TIME 10000
#define SOUND_SPEED 0.034  // cm/us

#define ULTRASONIC_TRIG_PIN 18
#define ULTRASONIC_ECHO_PIN 19
#define SERVO_PWM_PIN 13
#define STATUS_PIN 9

#define DEFAULT_AP_NAME "Smart_Door_Lock"
#define DEFAULT_AP_PASS "1234567890"

String httpsRequest(String url, bool authorize = false, const String& payload = "");
String notify(String message, String username);
void setClock();
void syncWithServer();
double getUltrasonicDistance();
bool isDoorOpen();
void setDoorOpen(bool open);

#define DEIVCE_TOKEN_LEN 23
char deviceToken[DEIVCE_TOKEN_LEN];

Servo servo;
WiFiMulti wiFiMulti;

DNSServer dnsServer;
WebServer server(80);

iotwebconf::IotWebConf iotWebConf(DEFAULT_AP_NAME, &dnsServer, &server, DEFAULT_AP_PASS);
iotwebconf::TextParameter tokenParam = iotwebconf::TextParameter("Device Token", "tokenParam", deviceToken, DEIVCE_TOKEN_LEN);

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.setDebugOutput(true);

  Serial.println();
  Serial.println();
  Serial.println();

  iotWebConf.setStatusPin(STATUS_PIN);
  iotWebConf.addSystemParameter(&tokenParam);
  iotWebConf.setConfigSavedCallback([]() {
    Serial.println("Config saved");
  });

  memset(deviceToken, 0, DEIVCE_TOKEN_LEN);

  // -- Initializing the configuration.
  iotWebConf.init();

  // -- Set up required URL handlers on the web server.
  server.on("/", [] { iotWebConf.handleConfig(); });
  server.onNotFound([]() { iotWebConf.handleNotFound(); });

  // WiFi.mode(WIFI_STA);
  // wiFiMulti.addAP(WIFI_SSID, WIFI_PASS);

  // Serial.println("Connecting");
  // while (wiFiMulti.run() != WL_CONNECTED) {
  //   delay(500);
  //   Serial.print(".");
  // }
  // Serial.println("");
  // Serial.print("Connected to WiFi network with IP Address: ");
  // Serial.println(WiFi.localIP());

  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);

  servo.attach(SERVO_PWM_PIN);

  Serial.print("Setup done");

  // setClock();
}

bool shouldDoorOpen = false;

void loop() {
  static uint32_t lastEchoTime = 0;
  static String pendingMessage = "";
  static uint32_t lastMovementTime = 0;

  syncWithServer();

  if (millis() - lastEchoTime > ECHO_DELAY) {
    double distance = getUltrasonicDistance();
    Serial.print("Distance (cm): ");
    Serial.println(distance);

    if (distance >= 1 && distance <= 10) {
      if (millis() - lastMovementTime > MOTION_DEBOUNCE_TIME)
        pendingMessage = "Motion detected!";
      lastMovementTime = millis();
    }
    lastEchoTime = millis();
  }

  setDoorOpen(shouldDoorOpen);

  if (pendingMessage != "") {
    notify(pendingMessage, TELEGRAM_CHAT_ID);
    pendingMessage = "";
  }

  iotWebConf.doLoop();
}

void setDoorOpen(bool open) {
  String message = "";
  if (open) {
    if (servo.read() == 0) message = "Door is opened!";
    servo.write(90);
  } else {
    servo.write(0);
  }

  // we post later to prioritise opening the door first.
  if (message != "") notify(message, TELEGRAM_CHAT_ID);
}

// returns the distance
double getUltrasonicDistance() {
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(1);

  // wait for echo
  uint32_t duration_us = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 1000 * 50);

  return (float)duration_us * SOUND_SPEED / 2;
}

void syncWithServer() {
  static uint32_t lastPollTime = 0;
  static WiFiClientSecure client;
  client.setCACert(rootCALetsEncryptCert);

  if (millis() - lastPollTime <= POLL_DELAY) return;
  lastPollTime = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected");
    return;
  }
  if (String(deviceToken) == "") {
    Serial.println("Token not initialized");
    return;
  }

  String url = String("https://") + WEBSERVER_DOMAIN + "/api/door";
  String payload = httpsRequest(url, true);

  DynamicJsonDocument doc(64);
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.printf("Parsing input failed! %s\n", err.c_str());
    return;
  }

  shouldDoorOpen = doc["door_open"].as<bool>();
}

String notify(String message, String chatID) {
  String url = String("https://") + WEBSERVER_DOMAIN + "/api/notify";

  return httpsRequest(url, true, message);
}

String httpsRequest(String url, bool authorize, const String& payload) {
  static HTTPClient https;
  static WiFiClientSecure client;
  client.setCACert(rootCALetsEncryptCert);

  if (WiFi.status() != WL_CONNECTED || !client) return "";

  bool ok = https.begin(client, url);
  if (!ok) {
    Serial.println("HTTPS begin failed");
    return "";
  }

  if (authorize) https.addHeader("Authorization", String("Bearer ") + deviceToken);

  int statusCode = payload == "" ? https.GET() : https.POST(payload);
  if (statusCode < 0) {
    Serial.printf("HTTPS GET failed %s\n", https.errorToString(statusCode).c_str());
    return "";
  }

  String response = https.getString();
  https.end();

  return response;
}

// Not sure if WiFiClientSecure checks the validity date of the certificate.
// Setting clock just to be sure...
void setClock() {
  configTime(0, 0, "pool.ntp.org");

  Serial.print(F("Waiting for NTP time sync: "));
  time_t nowSecs = time(nullptr);
  while (nowSecs < 8 * 3600 * 2) {
    delay(500);
    Serial.print(F("."));
    yield();
    nowSecs = time(nullptr);
  }

  Serial.println();
  struct tm timeinfo;
  gmtime_r(&nowSecs, &timeinfo);
  Serial.print(F("Current time: "));
  Serial.print(asctime(&timeinfo));
}