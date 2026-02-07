export async function loadConfig() {

    const config = {
    "GRID_CELL_SIZE": 1.0,
    "GRID_WIDTH": 70,
    "GRID_HEIGHT": 70,

    "GRAPH_EXTRA_EDGE_PROBABILITY": 0.12,

    "GRAPH_NODES_MIN_DISTANCE": 5,              // in grid cells
    "GRAPH_NODES_CONNECTED_MAX_DISTANCE": 20,    // in grid cells

    "POINT_SIZE" : 14,
    "TOLERANCE_RATIO" : 3.0,
    "NUMBER_OF_PERSONS" : 50,
    "BASE_COLOR" : 0xf7f7f7,
    "SELECTED_COLOR" : 0x5beb63,

    "SIMULATION_PACKET_SPAWN_PROBABILITY" : 0.15,
    "SIMULATION_PACKET_CORRUPTION_PROBABILITY" : 0.01, //TODO
    }

    return config
}
