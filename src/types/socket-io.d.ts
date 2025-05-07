// src/types/socket-io.d.ts
declare module 'socket.io-client' {
    export interface Socket {
      on(event: string, callback: (...args: any[]) => void): void;
      emit(event: string, ...args: any[]): void;
      disconnect(): void;
    }
  
    export function io(url: string, options?: any): Socket;
  }
  