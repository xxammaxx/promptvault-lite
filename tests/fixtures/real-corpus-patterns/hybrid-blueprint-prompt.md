---
title: "Implementierungsplan für neue API"
---

# API-Implementierung

Du bist ein Senior Backend-Entwickler und sollst eine neue REST-API implementieren.

## Architektur

- Controller → Service → Repository Pattern
- JWT-Authentifizierung
- Rate Limiting pro Endpunkt

## Aufgabe

Implementiere die CRUD-Endpunkte für das User-Modul.

## Akzeptanzkriterien

- Alle Endpunkte haben OpenAPI-Dokumentation
- Fehler werden einheitlich formatiert
- Integration-Tests decken 80% ab

## Vorgehen

1. Erstelle das Datenmodell
2. Implementiere Repository
3. Baue Service-Logik
4. Erstelle Controller
