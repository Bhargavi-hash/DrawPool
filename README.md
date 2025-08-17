# DrawPool
Synchronized Mulit-user drawing tool.

## High-level backend Plan
We’re building a Node.js server that hosts:

* A WebSocket server (to handle live drawing data).

* A place to store session data or snapshots (later, when we add persistence).

* A clean project structure so adding authentication, rooms, or scaling is easy later.

## Directory Structure

```
multiuser-drawing-tool/
├── server/                 # Backend code (we start here)
│   ├── package.json        # Dependencies for backend
│   ├── index.js            # Entry point (starts server)
│   ├── config/             # Configuration (port numbers, env)
│   │   └── default.js
│   ├── ws/                 # WebSocket-specific logic
│   │   └── connection.js   # Handles client connections
│   ├── docs/               # For backend documentation
│   │   └── architecture.md
│   └── utils/              # Helper functions (logging, etc)
│       └── logger.js
└── client/                 # Frontend code (later)

```