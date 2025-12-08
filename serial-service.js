const { SerialPort } = require("serialport");
const tools = require("./serial-tools");

class SerialService {
  constructor() {
    this.port = null;
    this.parser = null;
    this.isOpen = false;
    this.onDataCallback = null;
  }

  // ✅ 动态打开串口
  open(path, baudRate = 9600) {
    if (this.isOpen) {
      return { success: false, msg: "串口已打开，请先关闭" };
    }

    this.port = new SerialPort({
      path,
      baudRate,
      autoOpen: false,
    });

    this.port.on("data", (data) => {
      const dataStr = tools.byteToHex(data);
      if (this.onDataCallback)
        this.onDataCallback("data", tools.getParams(dataStr));
    });

    this.port.on("open", () => {
      this.isOpen = true;
      console.log(`✅ 串口已打开: ${path} @ ${baudRate}`);
    });

    this.port.on("error", (err) => {
      console.error("❌ 串口错误:", String(err.message));
    });

    this.port.on("close", () => {
      this.isOpen = false;
      console.log("🔌 串口已关闭");
    });

    this.port.open((err) => {
      if (err) console.error("❌ 打开串口失败:", String(err.message));
    });
    return { success: true, msg: "串口打开中..." };
  }

  // ✅ 获取可访问的列表
  async ports() {
    const ports = await SerialPort.list();
    const list = ports.map((p) => ({
      path: p.path,
      name: p.friendlyName || "",
      manufacturer: p.manufacturer || "",
      serialNumber: p.serialNumber || "",
    }));
    if (this.onDataCallback)
      this.onDataCallback("ports", tools.getParams(list));
  }

  // ✅ 关闭串口
  close() {
    if (!this.isOpen || !this.port) {
      return { success: false, msg: "串口未打开" };
    }

    this.port.close();
    return { success: true, msg: "关闭中" };
  }

  // ✅ 发送数据
  send(data) {
    if (!this.isOpen || !this.port)
      return { success: false, msg: "串口未打开" };
    const buf = tools.hexStringToBuffer(data);
    this.port.write(buf, (err) => {
      if (err) console.error("❌ 发送失败:", String(err.message));
    });
    return { success: true, msg: "发送成功" };
  }

  // ✅ 接收监听
  onData(callback) {
    this.onDataCallback = callback;
  }
}

module.exports = SerialService;
