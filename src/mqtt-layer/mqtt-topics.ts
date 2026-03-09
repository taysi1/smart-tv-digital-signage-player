export class MqttTopics {
  static commandTopic(deviceId: string): string {
    return "players/" + deviceId + "/commands";
  }

  static eventTopic(deviceId: string): string {
    return "players/" + deviceId + "/events";
  }
}
