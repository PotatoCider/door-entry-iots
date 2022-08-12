#ifndef _WEBCONF_H
#define _WEBCONF_H

#include <Arduino.h>

// on board LED
#define STATUS_PIN 2

// on board boot pin
#define CONFIG_PIN 0

#define DEFAULT_AP_NAME "Smart_Door_Lock"
#define DEFAULT_AP_PASS "1234567890"

String getDeviceToken();
void webConfInit();
void webConfLoop();

#endif  // _WEBCONF_H