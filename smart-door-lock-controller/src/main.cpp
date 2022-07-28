#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <Arduino.h>
#include <Servo.h>

const char* ssid = "AndroidAP57ed";
const char* password = "***REMOVED***";
const char* serverName = "http://***REMOVED***:4242/api/door"; //Your Domain name with URL path or IP address with path

String httpGETRequest(const char* serverName);

unsigned long lastTime = 0;
unsigned long timerDelay = 1000; // Set timer to 5 seconds (5000)

const int trigPin = 5;
const int echoPin = 18;
bool opendoor = false;

#define SOUND_SPEED 0.034 //define sound speed in cm/uS

long duration;
float distanceCm;

Servo myservo; // create servo object to control a servo
int pos = 0; // variable to store the servo position

void setup() {
  Serial.begin(9600); // Starts the serial communication
  
  WiFi.begin(ssid, password);
  Serial.println("Connecting");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
 
  Serial.println("Timer set to 5 seconds (timerDelay variable), it will take 5 seconds before publishing the first reading.");

  pinMode(trigPin, OUTPUT); // Sets the trigPin as an Output
  pinMode(echoPin, INPUT); // Sets the echoPin as an Input

  myservo.attach(13);  // attaches the servo on pin 13 to the servo object
}

void loop() {
  //Send an HTTP POST request every 10 minutes
  if ((millis() - lastTime) > timerDelay) {
    //Check WiFi connection status
    if(WiFi.status()== WL_CONNECTED){
              
      String payload = httpGETRequest(serverName);
      Serial.println(payload);
      JSONVar myObject = JSON.parse(payload);
  
      // JSON.typeof(jsonVar) can be used to get the type of the var
      if (JSON.typeof(myObject) == "undefined") {
        Serial.println("Parsing input failed!");
        return;
      }
    
      Serial.println(myObject["door"]);
      opendoor = (bool) myObject["door"];
    }
    else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }

  digitalWrite(trigPin, LOW);  // Clears the trigPin
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); // Sets the trigPin on HIGH state for 10 micro seconds
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  duration = pulseIn(echoPin, HIGH); // Reads the echoPin, returns the sound wave travel time in microseconds
  
  distanceCm = duration * SOUND_SPEED/2; // Calculate the distance

  if (opendoor) { //distanceCm < 7
    myservo.write(90);
    delay(100);
    Serial.println("Door opening!");
  }
  else {
    myservo.write(0);
    delay(100);
  }

  Serial.print("Distance (cm): "); // Prints the distance in the Serial Monitor
  Serial.println(distanceCm);
  
  delay(1000);
}

String httpGETRequest(const char* serverName) {
  WiFiClient client;
  HTTPClient http;

  http.begin(client, serverName); // Your Domain name with URL path or IP address with path
  
  int httpResponseCode = http.GET(); // Send HTTP POST request
  
  String payload = "{}"; 
  
  if (httpResponseCode>0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    payload = http.getString();
  }
  else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  // Free resources
  http.end();

  return payload;
}