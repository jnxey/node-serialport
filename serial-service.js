const { SerialPort } = require("serialport");
const tools = require("./serial-tools");

class SerialService {
  constructor() {
    this.port = null;
    this.isOpen = false;
    this.onDataCallback = null;
  }

  // 动态打开串口
  open(path, baudRate = 9600) {
    if (this.isOpen) {
      return { success: false, msg: "Serial is open" };
    }

    this.port = new SerialPort({
      path,
      baudRate,
      autoOpen: false,
    });

    this.port.on("data", (data) => {
      if (this.onDataCallback)
        this.onDataCallback("data", tools.byteToHex(data));
    });

    this.port.on("open", () => {
      this.isOpen = true;
      if (this.onDataCallback)
        this.onDataCallback("open-success", {
          msg: `Open: ${path} @ ${baudRate}`,
        });
    });

    this.port.on("error", (err) => {
      if (this.onDataCallback)
        this.onDataCallback("error", {
          msg: String(err.message),
        });
    });

    this.port.on("close", () => {
      this.isOpen = false;
      if (this.onDataCallback)
        this.onDataCallback("close", { msg: "Serial Close" });
    });

    this.port.open((err) => {
      if (err) {
        if (this.onDataCallback)
          this.onDataCallback("open-error", {
            msg: "Serial Error:" + String(err.message),
          });
      }
    });
    return { success: true, msg: "Serial Opening..." };
  }

  // 获取可访问的列表
  async ports() {
    const ports = await SerialPort.list();
    const list = ports.map((p) => ({
      path: p.path,
      name: p.friendlyName || "",
      manufacturer: p.manufacturer || "",
      serialNumber: p.serialNumber || "",
    }));
    if (this.onDataCallback) this.onDataCallback("ports", list);
  }

  // 关闭串口
  close() {
    if (!this.isOpen || !this.port) {
      return { success: false, msg: "Serial is not open" };
    }

    this.port.close();
    return { success: true, msg: "Closing" };
  }

  // ✅ 发送数据
  send(data) {
    if (!this.isOpen || !this.port)
      return { success: false, msg: "Serial is not open" };
    const buf = tools.hexStringToBuffer(data);
    this.port.write(buf, (err) => {
      if (err) {
        if (this.onDataCallback)
          this.onDataCallback(
            "send-error",
            "Send Error:" + String(err.message),
          );
      }
    });
    return { success: true, msg: "Send Success" };
  }

  // ✅ 接收监听
  onData(callback) {
    this.onDataCallback = callback;
  }
}

module.exports = SerialService;
