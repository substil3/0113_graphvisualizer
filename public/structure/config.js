export const INIT = 0;
export const ALIVE = 1;
export const NEED_FORWARD = 2;
export const WAIT_SEND = 3;
export const FINISH = 10;
export const ABORT = 98;
export const REMOVED = 99;

export async function loadConfig() {

    const config = {
        
    "PACKET_REQ_COLOR" : 0xf2f2f2,
    "PACKET_ACK_COLOR" : 0xb5ff3d,
    "PACKET_VIRUS_COLOR" : 0xff4444,
    "PACKET_CURE_COLOR" : 0x5beb63,
    "PACKET_REMOTE_COLOR" : 0x42ecff,
    "PACKET_BROADCAST_COLOR" : 0xffeb14,
    
    "PACKET_CHECK_BUSY_INTERVAL" : 50,
    "PACKET_WAITING_TIMEOUT" : 800,

    "PERSON_DEAD_STATE_TIME" : 1000,
    "PERSON_INFECTED_STATE_TIME" : 500,

    "PLAYER_INITIAL_COST" : 100,
    "PLAYER_COST_SEND_PACKET" : {
        "REQ" : 20,
        "ACK" : 0,
        "BROADCAST" : 100,
        "CURE" : 30,
        "REMOTE" : 50
    },

    "PLAYER_COST_GAIN_FORWARD_PACKET" : 5,
    "PLAYER_COST_GAIN_RECEIVED_ACK_PER_WEIGHT" : 1.2,
    "PLAYER_INITIAL_HEALTH" : 5,
    "PLAYER_COST_REFILL_TIME_INTERVAL" : 10,

    "HACKER_INITIAL_HEALTH" : 10,
    "HACKER_MAX_EXPLOIT" : 200,
    "HACKER_CREATE_VIRUS_POSSIBILITY" : 0.7,

    }

    return config
}
