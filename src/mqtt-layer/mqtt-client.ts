import mqtt from "mqtt";

export type MqttMessageHandler = (topic: string, payload: string) => void;

export interface MqttClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(topic: string, handler: MqttMessageHandler): Promise<void>;
  publish(topic: string, payload: string): Promise<void>;
}

export interface RealMqttClientOptions {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientId: string;
}

export class RealMqttClient implements MqttClient {
  private client: mqtt.MqttClient | null;
  private handlers: { [topic: string]: MqttMessageHandler };
  private readonly options: RealMqttClientOptions;

  constructor(options: RealMqttClientOptions) {
    this.options = options;
    this.client = null;
    this.handlers = {};
  }

  connect(): Promise<void> {
    var _this = this;

    return new Promise<void>(function (resolve, reject) {
      _this.client = mqtt.connect(_this.options.brokerUrl, {
        clientId: _this.options.clientId,
        username: _this.options.username,
        password: _this.options.password,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
      });

      _this.client.on("connect", function () {
        console.log("[RealMqttClient] connected");
        resolve();
      });

      _this.client.on("reconnect", function () {
        console.warn("[RealMqttClient] reconnecting...");
      });

      _this.client.on("error", function (error) {
        console.error("[RealMqttClient] error", error);
        reject(error);
      });

      _this.client.on("message", function (topic, message) {
        var handler = _this.handlers[topic];
        if (handler) {
          handler(topic, message.toString());
        }
      });
    });
  }

  disconnect(): Promise<void> {
    var _this = this;

    return new Promise<void>(function (resolve) {
      if (!_this.client) {
        resolve();
        return;
      }

      _this.client.end(false, function () {
        console.log("[RealMqttClient] disconnected");
        resolve();
      });
    });
  }

  subscribe(topic: string, handler: MqttMessageHandler): Promise<void> {
    var _this = this;

    return new Promise<void>(function (resolve, reject) {
      if (!_this.client) {
        reject(new Error("MQTT client is not connected"));
        return;
      }

      _this.client.subscribe(topic, function (error) {
        if (error) {
          reject(error);
          return;
        }

        _this.handlers[topic] = handler;
        console.log("[RealMqttClient] subscribed:", topic);
        resolve();
      });
    });
  }

  publish(topic: string, payload: string): Promise<void> {
    var _this = this;

    return new Promise<void>(function (resolve, reject) {
      if (!_this.client) {
        reject(new Error("MQTT client is not connected"));
        return;
      }

      _this.client.publish(topic, payload, function (error) {
        if (error) {
          reject(error);
          return;
        }

        console.log("[RealMqttClient] publish:", topic, payload);
        resolve();
      });
    });
  }
}
