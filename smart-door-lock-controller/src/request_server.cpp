#include "request_server.h"

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

#if __has_include("secrets.h")
#include "secrets.h"
#else
#include "secrets_default.h"
#endif

#include "cert.h"
#include "webconf.h"

SyncState syncWithServer() {
  static const SyncState emptyState = {.door_open = false};
  static SyncState curState = emptyState;
  static uint32_t lastPollTime = 0;
  static WiFiClientSecure client;
  client.setCACert(rootCALetsEncryptCert);

  if (millis() - lastPollTime <= WEBSERVER_POLL_DELAY) return curState;
  lastPollTime = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected");
    return emptyState;
  }

  String url = String("https://") + WEBSERVER_DOMAIN + "/api/door";
  String payload = httpsRequest(url, true);
  Serial.println(payload);
  DynamicJsonDocument doc(256);
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.printf("Parsing input failed! %s\n", err.c_str());
    return emptyState;
  }

  curState.door_open = doc["door_open"].as<bool>();
  return curState;
}

String notify(String message) {
  String url = String("https://") + WEBSERVER_DOMAIN + "/api/notify";

  return httpsRequest(url, true, message);
}

String httpsRequest(String url, bool authorize, const String& payload) {
  static HTTPClient https;
  static WiFiClientSecure* client = new WiFiClientSecure;
  client->setCACert(rootCALetsEncryptCert);

  if (WiFi.status() != WL_CONNECTED || !client) return "";

  bool ok = https.begin(*client, url);
  if (!ok) {
    Serial.println("HTTPS begin failed");
    return "";
  }

  if (authorize) https.addHeader("Authorization", String("Bearer ") + getDeviceToken());

  int statusCode = payload == "" ? https.GET() : https.POST(payload);
  if (statusCode < 0) {
    Serial.printf("HTTPS request failed %s\n", https.errorToString(statusCode).c_str());
    return "";
  }

  String response = https.getString();
  https.end();

  return response;
}