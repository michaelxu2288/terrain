console.log("loaded input");
const Input = {
    element: document.getElementById("inputs"),
    inputs: {},
    orderings: [],

    createRangeSlider(title, callback, settings, ) {

        settings = defaults(settings, {
            min: 0,
            max: 100,
            step: 1,
            value: 0,
            displayed_text: (val) => { return val; }
        });
        const slider = {
            title: title,
            title_element: document.createElement("label"),
            element: document.createElement("input"),
            value_element: document.createElement("span"),
            settings: settings,
            callback: callback
        };
        slider.title_element.innerText = title;
        slider.element.type = "range";
        slider.element.min = settings.min;
        slider.element.max = settings.max;
        slider.element.step = settings.step;
        slider.element.value = settings.value;
        slider.value_element.innerText = settings.displayed_text(settings.value);
        slider.element.addEventListener("input", (e) => {
            callback(e.target.value);
            slider.value_element.innerText = settings.displayed_text(e.target.value);
        });

        Input.orderings.push(slider);
        Input.element.appendChild(slider.title_element);
        Input.element.appendChild(document.createElement("br"))
        const spacer = document.createElement("span");
        spacer.className = "spacer";
        Input.element.appendChild(spacer);
        Input.element.appendChild(slider.element);
        Input.element.appendChild(slider.value_element);
    },
    createButton(title, callback) {
        const button = {
            title: title,
            element: document.createElement("button"),
            callback: callback
        };

        button.element.addEventListener("click", () => {
            callback();
        });
        button.element.innerText = title;

        Input.orderings.push(button);
        Input.element.appendChild(button.element);
    },
    break () {
        const shit = {
            element: document.createElement("br"),
        };
        Input.orderings.push(shit);

        Input.element.appendChild(shit.element);
    },
    text(name, text) {

        if (Input.inputs[name] !== undefined) {
            Input.inputs[name].text = text;
            Input.inputs[name].element.innerHTML = text;
            document.getElementById("text-" + name).innerHTML = text;
            return;
        }

        const thing = {
            name: name,
            text: text,
            element: document.createElement("span")
        }
        thing.element.innerText = text;
        thing.element.id = "text-" + name;
        Input.inputs[name] = thing;
        Input.orderings.push(thing);
        Input.element.appendChild(thing.element);
    },
    title(name, text) {
        if (Input.inputs[name] !== undefined) {
            Input.inputs[name].text = text;
            Input.inputs[name].element.innerText = text;
            return;
        }

        const thing = {
            name: name,
            text: text,
            element: document.createElement("span")
        }
        thing.element.innerText = text;
        thing.element.className = "title";
        Input.inputs[name] = thing;
        Input.orderings.push(thing);
        Input.element.appendChild(thing.element);
    },

    subtitle(name, text) {
        if (Input.inputs[name] !== undefined) {
            Input.inputs[name].text = text;
            Input.inputs[name].element.innerText = text;
            return;
        }

        const thing = {
            name: name,
            text: text,
            element: document.createElement("span")
        }
        thing.element.innerText = text;
        thing.element.className = "subtitle";
        Input.inputs[name] = thing;
        Input.orderings.push(thing);
        Input.element.appendChild(thing.element);
    }
}