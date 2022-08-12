#include "webconf.h"

#include <IotWebConf.h>
#include <LittleFS.h>

#include <ESPWebServerSecure.hpp>
#include <HTTPRequest.hpp>
#include <HTTPResponse.hpp>
#include <HTTPSServer.hpp>
#include <SSLCert.hpp>

#define DEIVCE_TOKEN_LEN 23
char deviceToken[DEIVCE_TOKEN_LEN];

using namespace httpsserver;

DNSServer dnsServer;

class WebServerSecureWrapper : public iotwebconf::WebServerWrapper {
 public:
  WebServerSecureWrapper() {}
  void setServer(ESPWebServerSecure* server) { _server = server; }
  void handleClient() { _server->handleClient(); }
  void begin() { _server->begin(); }

  ESPWebServerSecure* _server = NULL;
};

class WebRequestSecureWrapper : public iotwebconf::WebRequestWrapper {
 public:
  WebRequestSecureWrapper(ESPWebServerSecure* server) {
    this->_server = server;
  };

  const String hostHeader() const override { return this->_server->hostHeader(); };
  IPAddress localIP() override { return IPAddress(192, 168, 4, 1); };
  uint16_t localPort() override { return 443; };
  const String uri() const { return this->_server->uri(); };
  bool authenticate(const char* username, const char* password) override { return this->_server->authenticate(username, password); };
  void requestAuthentication() override { this->_server->requestAuthentication(); };
  bool hasArg(const String& name) override { return this->_server->hasArg(name); };
  String arg(const String name) override { return this->_server->arg(name); };
  void sendHeader(const String& name, const String& value, bool first = false) override { this->_server->sendHeader(name, value, first); };
  void setContentLength(const size_t contentLength) override { this->_server->setContentLength(contentLength); };
  void send(int code, const char* content_type = nullptr, const String& content = String("")) override { this->_server->send(code, content_type, content); };
  void sendContent(const String& content) override { this->_server->sendContent(content); };
  void stop() override { this->_server->send(200); };

 private:
  ESPWebServerSecure* _server;
};

IPAddress ipAddress(192, 168, 4, 1);

SSLCert cert;
ESPWebServerSecure server(ipAddress, 443);
WebServerSecureWrapper serverWrapper;

uint8_t certData[4096];
uint8_t pkData[4096];

bool loadOrGenerateCertificate();

iotwebconf::IotWebConf iotWebConf(DEFAULT_AP_NAME, &dnsServer, &serverWrapper, DEFAULT_AP_PASS);
iotwebconf::TextParameter tokenParam = iotwebconf::TextParameter("Device Token", "tokenParam", deviceToken, DEIVCE_TOKEN_LEN);

void webConfInit() {
  if (!LittleFS.begin()) {
    Serial.println("Unable to start LittleFS");
    if (LittleFS.format() && LittleFS.begin()) {
      Serial.println("Formatted LittleFS");

    } else {
      Serial.println("Unable to format LittleFS");
      while (1) delay(1000);
    }
  }

  if (!loadOrGenerateCertificate()) {
    while (1) delay(1000);
  }

  server.setServerKeyAndCert(cert.getPKData(), cert.getPKLength(), cert.getCertData(), cert.getCertLength());
  serverWrapper.setServer(&server);

  iotWebConf.setStatusPin(STATUS_PIN);
  iotWebConf.setConfigPin(CONFIG_PIN);
  iotWebConf.addSystemParameter(&tokenParam);
  iotWebConf.setConfigSavedCallback([]() {
    Serial.println("Config saved");
  });

  iotWebConf.skipApStartup();

  // -- Initializing the configuration.
  iotWebConf.init();

  // -- Set up required URL handlers on the web server.
  server.on("/", []() {
    if (iotWebConf.handleCaptivePortal(new WebRequestSecureWrapper(&server))) return;

    iotWebConf.handleConfig(new WebRequestSecureWrapper(&server));
  });
  server.on("/config", []() { iotWebConf.handleConfig(new WebRequestSecureWrapper(&server)); });
  server.onNotFound([]() { iotWebConf.handleNotFound(new WebRequestSecureWrapper(&server)); });

  // ResourceNode* nodeRoot = new ResourceNode("/", "GET", [](HTTPRequest* req, HTTPResponse* res) {
  //   iotWebConf.handleConfig();
  // });
  // ResourceNode* node404 = new ResourceNode("", "GET", [](HTTPRequest* req, HTTPResponse* res) {
  //   iotWebConf.handleNotFound();
  // });

  // server->registerNode(nodeRoot);
  // server->setDefaultNode(node404);
}

void webConfLoop() {
  iotWebConf.doLoop();
}

String getDeviceToken() {
  return String(deviceToken);
}

bool loadOrGenerateCertificate() {
  File pkFile = LittleFS.open("/private.der", "r");
  File certFile = LittleFS.open("/cert.der", "r");

  if (certFile && pkFile) {
    pkFile.read(pkData, pkFile.size());
    cert.setPK(pkData, pkFile.size());

    certFile.read(certData, certFile.size());
    cert.setCert(certData, certFile.size());
  } else {
    Serial.println("Private/Public key not found.\nCreating self-signed cert. This may take a minute...");
    int result = createSelfSignedCert(
        cert,
        KEYSIZE_2048,
        "CN=192.168.4.1,O=HongGanDynasty,C=SG",
        "20190101000000",
        "20300101000000");
    if (result != 0) {
      Serial.printf("Creating cert failed. Code: 0x%02X. See SSLCert.hpp\n", result);
      return false;
    }
    Serial.println("Created self-signed cert.");

    if (pkFile) pkFile.close();
    if (certFile) certFile.close();
    pkFile = LittleFS.open("/private.der", "w");
    certFile = LittleFS.open("/cert.der", "w");
    if (!certFile || !pkFile) {
      Serial.println("Unable to create cert/pk file");
      return false;
    }

    pkFile.write(cert.getPKData(), cert.getPKLength());
    certFile.write(cert.getCertData(), cert.getCertLength());
  }

  pkFile.close();
  certFile.close();
  return true;
}