#include <Arduino.h>
#include <Arduino_JSON.h>
#include <HTTPClient.h>
#include <Servo.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WiFiMulti.h>

#include "cert.h"
#include "urlencode.h"

// TODO: remove from repo
#define WIFI_SSID "Joseph"
#define WIFI_PASS "***REMOVED***"
#define WEBSERVER_URL "https://***REMOVED***/api/door"
// #ifndef TELEGRAM_BOT_TOKEN
#define TELEGRAM_BOT_TOKEN "***REMOVED***"
// #endif
// const char* ssid = "Joseph";
// const char* password = "***REMOVED***";
// const char* serverName = "https://***REMOVED***/api/door";  // Your Domain name with URL path or IP address with path

String httpGETRequest(String serverName, const char* caCert);
String postTelegramMessage(String message, String username);
void setClock();

unsigned long lastTime = 0;
unsigned long timerDelay = 1000;  // Set timer to 1 seconds (1000)

const int trigPin = 5;
const int echoPin = 18;
bool opendoor = false;

#define SOUND_SPEED 0.034  // define sound speed in cm/uS

long duration;
float distanceCm;

Servo myservo;  // create servo object to control a servo
int pos = 0;    // variable to store the servo position

WiFiMulti wiFiMulti;

void setup() {
  Serial.begin(115200);  // Starts the serial communication
  delay(100);
  Serial.setDebugOutput(true);

  Serial.println();
  Serial.println();
  Serial.println();

  WiFi.mode(WIFI_STA);
  wiFiMulti.addAP(WIFI_SSID, WIFI_PASS);

  Serial.println("Connecting");
  while (wiFiMulti.run() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());

  Serial.println("Timer set to 5 seconds (timerDelay variable), it will take 5 seconds before publishing the first reading.");

  pinMode(trigPin, OUTPUT);  // Sets the trigPin as an Output
  pinMode(echoPin, INPUT);   // Sets the echoPin as an Input

  myservo.attach(13);  // attaches the servo on pin 13 to the servo object

  setClock();
}

void loop() {
  // Send an HTTP POST request every 10 minutes
  if ((millis() - lastTime) > timerDelay) {
    // Check WiFi connection status
    if (WiFi.status() == WL_CONNECTED) {
      String payload = httpGETRequest(WEBSERVER_URL, rootCALetsEncryptCert);
      Serial.println(payload);
      JSONVar myObject = JSON.parse(payload);

      // JSON.typeof(jsonVar) can be used to get the type of the var
      if (JSON.typeof(myObject) == "undefined") {
        Serial.println("Parsing input failed!");
        return;
      }

      // Serial.println(myObject["is_open"]);
      opendoor = (bool)myObject["is_open"];
    } else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }

  digitalWrite(trigPin, LOW);  // Clears the trigPin
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);  // Sets the trigPin on HIGH state for 10 micro seconds
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH, 1000 * 100);  // Reads the echoPin, returns the sound wave travel time in microseconds

  distanceCm = duration * SOUND_SPEED / 2;  // Calculate the distance

  if (opendoor) {  // distanceCm < 7
    if (myservo.read() == 0)
      postTelegramMessage("door is opened", "gohjoseph");
    myservo.write(90);
    delay(100);
    Serial.println("Door opening!");
  } else {
    myservo.write(0);
    delay(100);
  }

  Serial.print("Distance (cm): ");  // Prints the distance in the Serial Monitor
  Serial.println(distanceCm);

  // delay(1000);
}

String postTelegramMessage(String message, String username) {
  String url = "https://api.telegram.org/bot";
  url += TELEGRAM_BOT_TOKEN;
  url += "/sendMessage?chat_id=@";
  url += username;
  url += "&text=";
  url += urlencode(message);
  return httpGETRequest(url, rootCATelegramCert);
}

String httpGETRequest(String serverName, const char* caCert) {
  WiFiClientSecure* client = new WiFiClientSecure;
  if (client) {
    client->setCACert(caCert);

    {
      // Add a scoping block for HTTPClient https to make sure it is destroyed before WiFiClientSecure *client is
      HTTPClient https;

      Serial.print("[HTTPS] begin...\n");
      if (https.begin(*client, serverName)) {  // HTTPS
        Serial.print("[HTTPS] GET...\n");
        // start connection and send HTTP header
        int httpCode = https.GET();

        // httpCode will be negative on error
        if (httpCode > 0) {
          // HTTP header has been send and Server response header has been handled
          Serial.printf("[HTTPS] GET... code: %d\n", httpCode);

          // file found at server
          if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
            String payload = https.getString();
            Serial.println(payload);
            return payload;
          }
        } else {
          Serial.printf("[HTTPS] GET... failed, error: %s\n", https.errorToString(httpCode).c_str());
        }

        https.end();
      } else {
        Serial.printf("[HTTPS] Unable to connect\n");
      }

      // End extra scoping block
    }
  }
  return "";
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