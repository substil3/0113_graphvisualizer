export const INIT = 0;
export const ALIVE = 1;
export const NEED_FORWARD = 2;
export const WAIT_SEND = 3;
export const FINISH = 10;
export const ABORT = 98;
export const REMOVED = 99;

export async function loadConfig() {

    const config = {

    "REQ_COLOR" : 0xff4444,
    "ACK_COLOR" : 0x5beb63,
    
    "PACKET_CHECK_BUSY_INTERVAL" : 100,
    "PACKET_WAITING_TIMEOUT" : 1000
    }

    return config
}
