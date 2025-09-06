export interface ServerProfile {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    authMethod: 'password' | 'key';
    password?: string;
    keyPath?: string;
}

export interface Session {
    id: string;
    profileId: string;
    profileName: string;
    isConnected: boolean;
    isConnecting: boolean;
}