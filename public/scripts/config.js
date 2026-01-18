export async function loadConfig() {

    const config = {
    "GRID_CELL_SIZE": 1.0,
    "GRID_WIDTH": 80,
    "GRID_HEIGHT": 80,

    "SCENE_NODES_MIN_DISTANCE": 5,              // in grid cells
    "SCENE_NODES_CONNECTED_MAX_DISTANCE": 10,    // in grid cells

    "POINT_SIZE" : 14,
    "TOLERANCE_RATIO" : 3.0,
    "NUMBER_OF_PERSONS" : 15,
    "BASE_COLOR" : 0xf7f7f7,
    "SELECTED_COLOR" : 0x5beb63

    }

    return config
}
