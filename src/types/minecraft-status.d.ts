declare module 'minecraft-status' {
  export interface ServerStatus {
    online: boolean;
    version?: string;
    motd?: string;
    players?: {
      online: number;
      max: number;
      sample?: Array<{
        name: string;
        id: string;
      }>;
    };
  }

  export function ping(host: string, port?: number): Promise<ServerStatus>;
} 