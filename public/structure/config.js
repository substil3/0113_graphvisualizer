export const INIT = 0;
export const ALIVE = 1;
export const NEED_FORWARD = 2;
export const FINISH = 3;
export const REMOVED = 99;

export async function loadConfig() {

    const config = {

    "REQ_COLOR" : 0xff4444,
    "ACK_COLOR" : 0x5beb63

    }

    return config
}
