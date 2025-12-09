const http = require("http");
const WebSocket = require("ws");
const SerialService = require("./serial-service");
const tools = require("./serial-tools");

const serial = new SerialService();
const PORT = 9988;

const server = http.createServer((req, res) => {
  res.end("WS Serial Server Running");
});

server.listen(PORT, () => {
  console.log(`WebSocket Open: ws://localhost:${PORT}`);
});

const wss = new WebSocket.Server({
  server,
  verifyClient: (info, done) => done(true),
});

wss.on("connection", (ws) => {
  console.log("Client Connection");

  // 串口数据回调 → 推送给前端
  serial.onData((type, data) => {
    ws.send(tools.getParams({ type: type, data }));
  });

  // 接收前端指令
  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message);
      let result;

      switch (msg.action) {
        case "open":
          result = serial.open(msg.path, msg.baudRate);
          break;
        case "send":
          result = serial.send(msg.data);
          break;
        case "close":
          result = serial.close();
          break;
        case "ports":
          serial.ports();
          result = { success: false, msg: "Success" };
          break;
        default:
          result = { success: false, msg: "Unknow" };
      }

      ws.send(
        tools.getParams({ type: "result", action: msg.action, ...result }),
      );
    } catch (e) {
      ws.send(tools.getParams({ type: "error", msg: String(e.message) }));
    }
  });

  // ✅ 监听客户端断开
  ws.on("close", (code, reason) => {
    console.log("Client Close: ", code, String(reason));
    serial.close();
  });

  // ✅ 监听连接错误
  ws.on("error", (err) => {
    ws.send(tools.getParams({ type: "error", msg: String(err?.message) }));
  });
});
