#ifndef _WEBSERVER_REQUEST_H
#define _WEBSERVER_REQUEST_H

#include <Arduino.h>

#define WEBSERVER_POLL_DELAY 1000

struct SyncState {
  bool door_open;
};

String httpsRequest(String url, bool authorize = false, const String& payload = "");
String notify(String message);

SyncState syncWithServer();

#endif  // _WEBSERVER_REQUEST_H