# ✨ Interactive 3D Rubik's Cube 

A stunning, fully-functional, and interactive 3D Rubik's Cube web application. Designed with modern aesthetics, an advanced animation engine, custom spring-back drag interactions, and highly isolated UI elements.

**Created by: Ayika Lokesh Sai Srinivas**

## 🚀 Features
- 🎮 **Premium Aesthetics**: Matte inner cores with high-gloss colorful outer "stickers".
- 🕹️ **Spring-Back Camera**: Click and drag to inspect the cube from any angle. Once you release your mouse, the cube elegantly snaps back to its native alignment for precise puzzle checking.
- ⚙️ **Custom Keybindings**: Completely remap your control suite dynamically using the interactive Settings menu.
- 🎓 **Isolated Multi-Canvas Tutorials**: The help menu uses advanced multiple separate WebGL contexts to isolate continuously looping mini-cubes that demonstrate specific slice rotation behaviors without interrupting your active game state.
- 🐋 **Docker Ready**: Complete, highly optimized 2-stage internal orchestration configuration for blazing fast and completely zero-bloat Nginx deployments.

## 💻 Tech Stack
- Frontend: **React**, **TypeScript**, **Vite**
- 3D Engine: **Three.js**, **React Three Fiber (R3F)**, **Drei**
- State Management: **Zustand**
- Containerization: **Docker**

## 📌 Usage & Development

### Standard Setup
Ensure you have Node.js installed, then:
```bash
npm install
npm run dev
```
Access the local preview instantly at `http://localhost:5173`.

### Docker Production Setup
Want to run the strictly compiled, lightweight production-grade engine natively over Nginx?
```bash
docker compose up -d --build
```
Your 3D cube web-app is securely running detached at `http://localhost:8080`.

## 📜 License & Credits

This project is open-source and released to the public under the **MIT License**.
Anyone is absolutely free to download, use, modify, or embed this 3D engineering in their own websites or servers!

**The only requirement is that you must provide full credit to the original creator:** 
*Ayika Lokesh Sai Srinivas*
