console.log("ui loaded")

function checkOverflowBounds() {
    return 2 * Settings.tiles * Settings.trisPerTile > Math.pow(2, Settings.height_map_size) + 1;
}

function createUI() {
    return new Promise((res, rej) => {
        Input.title("title", "Terrain Generator");
        Input.break();
        Input.break();
        Input.subtitle("maptitle", "Map Settings (Requires Regeneration)")
        Input.break();
        Input.createRangeSlider("Height map size", (e) => {
            Settings.height_map_size = e;
            if (checkOverflowBounds()) {
                Input.text("error", "You are rendering more heights than you height map size, and will probably see an overflow if you use these settings. You can fix this by decreasing the number of tiles you are rendering or increasing your height map size. This will not crash the program.")
            } else {
                Input.text("error", "")
            }
        }, {
            min: 1,
            max: 12,
            step: 1,
            value: 11,
            displayed_text: (e) => {
                const val = Math.pow(2, e) + 1;
                return val + "x" + val + " Square";
            }
        });

        Input.break();

        Input.createRangeSlider("Noise Scale", (e) => {
            Settings.noise_scale = e;
        }, {
            min: 0.01,
            max: 100,
            step: 0.01,
            value: Settings.noise_scale
        })

        Input.break();
        Input.break();

        Input.createButton("Regenerate map", () => {
            if (idle) {
                generateMap();
            }
        })
        Input.break();


        Input.break();
        Input.subtitle("tiletitle", "Tile Settings (Requires Regeneration)");
        Input.break();

        Input.createRangeSlider("Number of Tiles", (e) => {
            Settings.tiles = e;
            if (checkOverflowBounds()) {
                Input.text("error", "You are rendering more heights than you height map size, and will probably see an overflow if you use these settings. You can fix this by decreasing the number of tiles you are rendering or increasing your height map size. This will not crash the program.")
            } else {
                Input.text("error", "")
            }
        }, {
            min: 1,
            max: 20,
            step: 1,
            value: Settings.tiles,
            displayed_text: (e) => {
                const val = 2 * e;
                return val + "x" + val + " Square";
            }
        })

        Input.break();
        Input.createRangeSlider("Tile Size", (e) => {
            Settings.tileSize = e;
        }, {
            min: 0.1,
            max: 200,
            step: 0.1,
            value: Settings.tileSize,
            displayed_text: (e) => {
                const val = e;
                return val + "x" + val + " Tile";
            }
        })

        // Input.break();

        // Input.createRangeSlider("Triangles per Tile", (e) => {
        //     Settings.trisPerTile = e;
        // }, {
        //     min: 1,
        //     max: 200,
        //     step: 1,
        //     value: Settings.trisPerTile,
        //     displayed_text: (e) => {
        //         const val = 2 * e;
        //         return val + " triangles per tile";
        //     }
        // })

        Input.break();
        Input.createRangeSlider("Triangle Skip (Don't mess with this one unless you know what you are doing)", (e) => {
            Settings.tileSkip = e;
        }, {
            min: 1,
            max: 100,
            step: 1,
            value: Settings.tileSkip,
            displayed_text: (e) => {
                const val = e;
                return "Skip " + val + (val == 1 ? " triangle" : " triangles");
            }
        })
        Input.break();
        Input.break();

        Input.createButton("Regenerate tiles (Does not regenerate the map)", () => {
            if (idle) {
                initBuffers();
            }
        })
        Input.break();
        Input.break();
        Input.subtitle("rendertitle", "Render Settings (Does not Require Regeneration)");
        Input.break();
        Input.createRangeSlider("Snowline (The location of the line of snow)", (e) => {
            Settings.snowLine = e;
            change = true;
        }, {
            min: -10,
            max: 10,
            step: 0.1,
            value: Settings.snowLine,
        });
        Input.break();
        Input.createRangeSlider("Steepness Cutoff (How steep before it becomes bare stone)", (e) => {
            Settings.steepnessCutoff = e;
            change = true;
        }, {
            min: 0,
            max: 1,
            step: 0.01,
            value: Settings.steepnessCutoff,
        });
        Input.break();
        Input.break();
        Input.text("error", "");
        Input.break();
        Input.text("fps", "");
        Input.break();
        Input.text("status", "IDLE");
        Input.break();
        res();
    })
}