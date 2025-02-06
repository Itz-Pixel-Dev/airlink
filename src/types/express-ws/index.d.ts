import { Application as ExpressApp } from 'express';
import { Server as WebSocketServer } from 'ws';

declare module 'express-ws' {
	interface Application extends ExpressApp {
		ws: (route: string, handler: (ws: WebSocket, req: Request) => void) => void;
	}

	interface Instance {
		app: Application;
		getWss: () => WebSocketServer;
	}

	interface Options {
		wsOptions?: WebSocketServer.ServerOptions;
	}

	function expressWs(app: ExpressApp, server?: any, options?: Options): Instance;
	
	export = expressWs;
}