console.log("ui loaded")

function checkOverflowBounds() {
    return 2 * Settings.tiles * Settings.trisPerTile > Math.pow(2, Settings.height_map_size) + 1;
}

function createUI() {
    return new Promise((res, rej) => {
        let text = "my website";
        let result = text.link("https://www.mathias.cf");
        Input.title("title", "Terrain Generator (By Mathias Ooi, follow me at www.mathias.cf)");
        Input.break();
        Input.break();
        Input.subtitle("maptitle", "Map Settings (Requires Regeneration)")
        Input.break();
        Input.createRangeSlider("Height map size (by the way, did you know i made this website?)", (e) => {
            Settings.height_map_size = e;
            if (checkOverflowBounds()) {
                Input.text("error", "fucking dumbass. You are rendering more heights than you height map size, and will probably see an overflow if you use these settings. You can fix this by decreasing the number of tiles you are rendering or increasing your height map size. This will not crash the program.")
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

        Input.createRangeSlider("Noise Scale (i spent a lot of time making this website)", (e) => {
            Settings.noise_scale = e;
        }, {
            min: 0.01,
            max: 100,
            step: 0.01,
            value: Settings.noise_scale
        })
        Input.break();
        Input.createRangeSlider("Blur radius (A=pi*r^2)", (e) => {
            Settings.blurRadius = e;
        }, {
            min: 0,
            max: 20,
            step: 1,
            value: Settings.blurRadius,
        });
        Input.break();
        Input.break();

        Input.createButton("Regenerate map, click this button to get your ip tracked", () => {
            if (idle) {
                generateMap();
            }
        })
        Input.break();


        Input.break();
        Input.subtitle("tiletitle", "Tile Settings (Requires Regeneration) (ATTENTION: Mathias Ooi (15M), is currently being tracked by the Federal Bureau of Investigation (FBI). If you have any knowledge on his whereabouts, please contact us at +1 408-207-6009");
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

        Input.break();

        Input.createRangeSlider("Triangles per Tile", (e) => {
            Settings.trisPerTile = e;
            if (checkOverflowBounds()) {
                Input.text("error", "You are rendering more heights than you height map size, and will probably see an overflow if you use these settings. You can fix this by decreasing the number of tiles you are rendering or increasing your height map size. This will not crash the program.")
            } else {
                Input.text("error", "")
            }
        }, {
            min: 1,
            max: 200,
            step: 1,
            value: Settings.trisPerTile,
            displayed_text: (e) => {
                const val = 2 * e;
                return val + " triangles per tile";
            }
        })

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
        Input.createRangeSlider("Heightmap Scale", (e) => {
            Settings.heightScale = e;
        }, {
            min: 0.1,
            max: 100,
            step: 0.1,
            value: Settings.heightScale,
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
        Input.createCheckbox("Wireframe", (e) => {
            Settings.wireframe = e;
            change = true;
        }, {

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
