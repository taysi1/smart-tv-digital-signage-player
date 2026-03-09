export interface AppConfig {
  mqttBrokerUrl: string;
  mqttUsername?: string;
  mqttPassword?: string;
  playlistEndpointUrl: string;
}

export function getConfig(): AppConfig {
  return {
    mqttBrokerUrl: "ws://broker.emqx.io:8083/mqtt",
    playlistEndpointUrl: "http://192.168.1.103:3000/playlist.json",
  };
}
