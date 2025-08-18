# DrawPool: Collaborative Drawing Application

A real-time collaborative drawing platform built with **Fabric.js**, **Yjs**, and **WebSockets**, allowing multiple users to draw on the same canvas simultaneously.  

This project supports:
- Real-time shared canvas updates
- Undo/redo with Yjs `UndoManager`
- User-specific colors
- Persistence with Redis
- Scalable architecture for multiple rooms

---

## Table of Contents

1. [Overview](#overview)  
2. [Architecture](#architecture)  
3. [Frontend](#frontend)  
4. [Backend](#backend)  
5. [Persistence](#persistence)  
6. [Data Flow](#data-flow)  
7. [Setup & Run](#setup--run)  
8. [Future Enhancements](#future-enhancements)  

---

## Overview

The app enables multiple users to draw on a shared canvas and see each other’s updates instantly. Every client maintains a **Yjs document** that syncs with the server. The server keeps a canonical copy of the document per room and broadcasts updates to all connected clients.  

---

## Architecture

### Components

- **Frontend (Browser)**
  - Fabric.js canvas for drawing
  - Yjs client to manage shared document state
  - WebSocket client to send/receive updates

- **Backend (Node.js / WebSocket server)**
  - Room manager with one `Y.Doc` per room
  - Broadcast updates to connected clients
  - Optional Redis for persistence

- **Persistence Layer (Redis)**
  - Stores serialized Yjs documents per room
  - Enables reconnects and horizontal scaling

---

## Frontend

**Key Components:**

1. **Fabric.js Canvas**  
   - Handles rendering and user interactions  
   - Supports freehand drawing and brush customization  

2. **Yjs Document**  
   - Shared map stores the canvas JSON (`ymap.get('canvas')`)  
   - Observers trigger updates whenever the document changes  

3. **WebSocket Client**  
   - Connects to backend via `ws://localhost:1234?room=<roomName>`  
   - Sends incremental updates and receives updates from other clients  

**Flow:**

1. User draws → triggers `path:created` event  
2. Serialize canvas → update Yjs map  
3. Yjs triggers observer → sends update via WebSocket  
4. Other clients receive update → apply to Yjs map → update Fabric canvas  

This ensures **eventual consistency** across all clients.  

---

## Backend

**Components:**

- **WebSocket Server**
  - Listens for client connections  
  - Manages rooms and clients  

- **Room Manager**
  - Maintains one `Y.Doc` per room  
  - Broadcasts updates to clients  

- **Protocol**
  - Framing format: `[1 byte type][4 byte length][payload]`  
  - Types:
    - `SYNC_STATE` → full state sent to new clients  
    - `UPDATE` → incremental updates broadcasted  

**Flow:**

1. New client connects → server sends `SYNC_STATE` with full document  
2. Client sends `UPDATE` → server applies → broadcasts to others  
3. Optional Redis persistence allows restoring the document on reconnect  

---

## Persistence

- Uses Redis to store serialized Yjs documents per room  
- Key format: `room:<roomName>`  
- Benefits:
  - Reconnect without losing drawings  
  - Survive server restarts  
  - Enable horizontal scaling  

---

## Data Flow Diagram
```
                                 +----------------+
                                 |     AWS        |
                                 |  (optional)    |
                                 |  Load Balancer |
                                 +--------+-------+
                                          |
                                          v
                             +------------------------+
                             |  WebSocket / Node.js   |
                             |      Backend Server    |
                             +------------------------+
                             |  Room Manager / Y.Doc  |
                             |  (1 per room)          |
                             +------------------------+
                                          |
                 +------------------------+------------------------+
                 |                                                 |
                 v                                                 v
        +----------------+                                +----------------+
        | Redis Storage  |                                | Database (future) |
        |  (persistent)  |                                |  optional        |
        +----------------+                                +----------------+
           ^           ^
           |           |
           |  Save / Load document snapshots (Yjs state)
           |           |
           +-----------+
                  |
     Yjs document sync (encoded updates, SYNC_STATE / UPDATE)
                  |
        +----------------+                 +----------------+
        |  Browser User A|                 | Browser User B |
        |  Fabric.js     |                 |  Fabric.js     |
        |  Yjs Client    |                 |  Yjs Client    |
        +----------------+                 +----------------+
                 |                                  |
                 | path:created / canvas updates    |
                 |                                  |
                 v                                  v
          Canvas serialized JSON              Canvas serialized JSON
          → update Yjs map                     → update Yjs map
                 |                                  |
                 +----------- WebSocket ---------->+
                 |                                  |
                 v                                  v
         Backend Room Manager applies updates, broadcasts to all other clients
                 |
                 +---------------------------+
                 |  Save latest document     |
                 |  snapshot to Redis        |
                 +---------------------------+
                 |
       Broadcast incremental updates (Yjs UPDATE) to all other connected clients
                 |
        Clients receive updates → update Yjs → re-render Fabric canvas

```

## Setup and Run
Download this repository manually or clone the repo using `git clone https://github.com/Bhargavi-hash/DrawPool.git`

### 1. Install backend dependencies
```
cd Drawpool
cd server
npm install
```
### 2. Run backend
```node index.js```

### 3. Install frontend dependencies
```
cd ..
cd client
npm install
```

### 4. Run frontend 
```
npm run dev
```

### 5. Access app
Open browser at `http://localhost:5173`
You can also open multiple windows on the browser at the same site and share a canvas in a team.
