#include "webconf.h"

#include <EEPROM.h>
#include <IotWebConf.h>

#define DEIVCE_TOKEN_LEN 23
char deviceToken[DEIVCE_TOKEN_LEN];

DNSServer dnsServer;
WebServer server(80);

iotwebconf::IotWebConf iotWebConf(DEFAULT_AP_NAME, &dnsServer, &server, DEFAULT_AP_PASS);
iotwebconf::TextParameter tokenParam = iotwebconf::TextParameter("Device Token", "tokenParam", deviceToken, DEIVCE_TOKEN_LEN);

void webConfInit() {
  pinMode(CONFIG_PIN, INPUT_PULLUP);
  if (digitalRead(CONFIG_PIN) == 0) {
    EEPROM.begin(192);
    EEPROM.write(0, 0);  // force a config reset
    EEPROM.end();
  }

  iotWebConf.setStatusPin(STATUS_PIN);
  // iotWebConf.setConfigPin(CONFIG_PIN);

  iotWebConf.getApPasswordParameter()->label = "Reconfiguration password";
  iotWebConf.addSystemParameter(&tokenParam);
  iotWebConf.setConfigSavedCallback([]() {
    Serial.println("Config saved");
  });
  iotWebConf.skipApStartup();

  // -- Initializing the configuration.
  iotWebConf.init();

  // -- Set up required URL handlers on the web server.
  server.on("/", [] { iotWebConf.handleConfig(); });
  server.onNotFound([]() { iotWebConf.handleNotFound(); });
}

void webConfLoop() {
  iotWebConf.doLoop();
}

String getDeviceToken() {
  return String(deviceToken);
}