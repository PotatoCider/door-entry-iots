# TR 64 Compliance Checklist

A Checklist is important in assessing how secure the IoT based project is. Below is a compliance checklist we adhered to.
[Reference](https://www.imda.gov.sg/-/media/Imda/Files/Regulation-Licensing-and-Consultations/ICT-Standards/Telecommunication-Standards/Reference-Spec/IMDA-IoT-Cyber-Security-Guide.pdf)

## Attack Surface 1: Web Client
### Checklist: 


## Attack Surface 1: Central Web Server & Web Client
### Checklist:
  - TR64: CS-01 - Do your devices and system properly utilise industry accepted cryptographic techniques and best practices?
  
    - Yes. We try to use industry's best practices as much as possible.
      - TLS v1.2 is used for all HTTPS requests. Connections over deprecated TLSv1.0 and v1.1 are not accepted to restrict attack surfaces.
      - Passwords are salted and hashed using the [PBKDF2](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2) (Password-Based-Key-Derivation-Function 2) function provided by the builtin crypto library in node.
        - 310,000 rounds with SHA256 is used as recommended by FIPS-140
      - We use node's standard library crypto RNG `crypto.randomBytes()` for generating salts 
  
  - TR64: CS-02 - Do you employ proper key management (generation, exchange, storage, use, destruction, replacement, etc.) techniques?
    - Yes. We plan to rotate the secrets used to encrypt session cookies at least every month

  - TR64: IA-01 - Do you employ unique, non-modifiable and verifiable identities for clients (user, device, gateway, application) and servers?
    - # **TODO**
  
  -
    
## Attack Surface 2: ESP32
### Checklist:
- TR 64 : AP-04 **[done]**

    - Tamper-proof Enclosure
    The 3D-printed box requries a 60mm long screwdriver to access. Special screws have been designed, and each screw slot is to be fitted with a special screw bit. 

- TR 64 : AP-03 **[done with proof of concept]**

    - No exposed joints/conenctors to open devices 
    
    The miro USB of the device is to stuffed with a residual MicroUSB head and hot glued to prevent easy access to rewrite firmware (materials prepared). The hardware serial is hot glued and pins are desoldered, making it difficult to access.
    
- TR 64 : RS-03

    - Secure Communications **[done]**
    
    ESP32 is conencted to a local Access Point protected with WPA-PSK, and communicates with AWS-IoT via MQTTS.
    
## Attack Surface 4; System as a whole
### Checklist:
- TR 64 : LP-01  **[done]**

    - Conducted threat modeling to identify threats
    The team used the STRIDE tool to identify threats on the network architecture, which then led to this compliance checklist. 
    
- TR 64 : LP-02 

    - System designed in a secure way **[done]**
    
    All HTTP requests are done over TLS (i.e. HTTPS connection via port 443)