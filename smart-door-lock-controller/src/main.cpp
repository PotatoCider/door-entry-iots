#include <Arduino.h>
#include <EEPROM.h>
#include <HTTPClient.h>
#include <Servo.h>
#include <WiFi.h>

#include "request_server.h"
#include "webconf.h"

#define ECHO_DELAY 500
#define MOTION_DEBOUNCE_TIME 10000
#define SOUND_SPEED 0.034  // cm/us

#define ULTRASONIC_TRIG_PIN 18
#define ULTRASONIC_ECHO_PIN 19
#define SERVO_PWM_PIN 13

void setClock();

double getUltrasonicDistance();
void setDoorOpen(bool open);
void checkMotion();

Servo servo;

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.print("\n\n\n");

  webConfInit();

  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);

  servo.attach(SERVO_PWM_PIN);

  Serial.println("Setup done");

  // NOTE: we do not setClock since NTP port 123
  // is blocked in the school's lab
  // setClock();
}

void loop() {
  SyncState state = syncWithServer();
  setDoorOpen(state.door_open);

  checkMotion();
  webConfLoop();

  yield();
}

void checkMotion() {
  static uint32_t lastEchoTime = 0;
  static uint32_t lastMovementTime = 0;

  if (millis() - lastEchoTime <= ECHO_DELAY) return;

  String message = "";

  double distance = getUltrasonicDistance();

  if (distance >= 1 && distance <= 10) {
    if (millis() - lastMovementTime > MOTION_DEBOUNCE_TIME) message = "Motion detected!";

    lastMovementTime = millis();
    Serial.printf("Motion detected: %d cm\n", distance);
  }
  lastEchoTime = millis();

  if (message != "") notify(message);
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
  if (message != "") notify(message);
}

double getUltrasonicDistance() {
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(1);

  // wait for echo; timeout 50ms
  uint32_t duration_us = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 1000 * 50);

  return (float)duration_us * SOUND_SPEED / 2;
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