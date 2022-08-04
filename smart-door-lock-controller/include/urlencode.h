#ifndef _URLENCODE_H
#define _URLENCODE_H

#include <Arduino.h>

String urlencode(String str);
String urldecode(String str);
unsigned char h2int(char c);

#endif  // _URLENCODE_H