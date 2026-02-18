export async function loadConfig() {

    const config = {
    "GRID_CELL_SIZE": 1.0,
    "GRID_WIDTH": 40,
    "GRID_HEIGHT": 40,

    "GRAPH_EXTRA_EDGE_PROBABILITY": 0.03,

    "GRAPH_NODES_MIN_DISTANCE": 3,              // in grid cells
    "GRAPH_NODES_CONNECTED_MAX_DISTANCE": 20,    // in grid cells

    "POINT_SIZE" : 14,
    "TOLERANCE_RATIO" : 3.0,
    "NUMBER_OF_PERSONS" : 100,
    "PERSON_BASE_COLOR" : 0xf7f7f7,
    "PERSON_MALICIOUS_COLOR" : 0xe04343,
    "PERSON_SELECTED_COLOR" : 0x5beb63,
    "PERSON_INFECTED_COLOR" : 0xedc00e,   
    "PERSON_DEAD_COLOR" : 0xe04343,

    "PERSON_PLAYER_COLOR" : 0x42ecff,

    "PERSON_TYPE_INT_MAPPING" : {
        "NORMAL" : 1,
        "MALICIOUS"  : 2,
        "INFECTED" : 3,

        "PLAYER" : 0
    },

    "SIMULATION_TOTAL_NUMBER_OF_PACKETS" : 500,
    "SIMULATION_PACKET_SPAWN_PROBABILITY" : 0,
    "SIMULATION_PACKET_CORRUPTION_PROBABILITY" : 0.01, //TODO
    "SIMULATION_DEVELOPER_MODE" : false
    }

    return config
}
