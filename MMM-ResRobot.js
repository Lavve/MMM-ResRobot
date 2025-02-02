/* Resrobot - Timetable for ResRobot Module */

/* Magic Mirror
 * Module: MMM-ResRobot
 *
 * By Johan Alvinger https://github.com/Alvinger
 * based on a script by Benjamin Angst http://www.beny.ch which is
 * based on a script from Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */
 Module.register("MMM-ResRobot",{

    // Define module defaults
    defaults: {
        updateInterval: 5 * 60 * 1000,  // Update module every 5 minutes.
        animationSpeed: 2000,
        fade: true,
        fadePoint: 0.25,    // Start on 1/4th of the list.
        apiBase: "https://api.resrobot.se/v2/departureBoard?format=json&passlist=0",
        apiKey: "<YOUR RESROBOT API KEY HERE>",
        routes: [
            {from: "740020749", to: ""},    // Each route has a starting station ID from ResRobot, default: Stockholm Central Station (Metro)
        ],                  // and a destination station ID from ResRobot, default: none
        skipMinutes: 0,     // Number of minutes to skip before showing departures
        maximumEntries: 6,  // Maximum Entries to show on screen
        truncateAfter: 5,   // A value > 0 will truncate direction name at first space after <value> characters. Default: 5
        iconTable: {
            "B": "fa fa-bus",
            "S": "fa fa-subway",
            "J": "fa fa-train",
            "U": "fa fa-subway",
            "F": "fa fa-ship",
        },
        type: {
            "B": "bus",
            "S": "tram",
            "J": "train",
            "U": "tram",
            "F": "boat"
        }
    },

    // Define required styles.
    getStyles: function() {
        return ["MMM-ResRobot.css", "font-awesome.css"];
    },

    // Define required scripts.
    getScripts: function() {
        return ["moment.js"];
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);

        // Set locale.
        moment.locale(this.config.language);

        this.departures = [];
        this.loaded = false;
        this.sendSocketNotification("CONFIG", this.config);
    },

    socketNotificationReceived: function(notification, payload) {
        Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
        if (notification === "DEPARTURES") {
            this.departures = payload;
            this.loaded = true;
            this.scheduleUpdate(0);
        }
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

        if (this.config.routes === "") {
            wrapper.innerHTML = "Please set at least one route to watch name: " + this.name + ".";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (!this.loaded) {
            wrapper.innerHTML = "Fetching departures ...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        var table = document.createElement("table");
        table.className = "small";

        var cutoff = moment().add(moment.duration(this.config.skipMinutes, "minutes"));
        var n = 0;
        for (var d in this.departures) {
            if (n >= this.config.maximumEntries) {
                break;
            }
            var departure = this.departures[d];
            if (moment(departure.timestamp).isBefore(cutoff)) {
                continue;
            }
            n++;

            var startTime = moment(new Date());
            var endTime = moment(departure.departuretime, "HH:mm");
            var duration = moment.duration(endTime.diff(startTime));
            // var dep = duration.asMinutes();
            var hours = parseInt(duration.asHours());
            var minutes = parseInt(duration.asMinutes())%60;
            var dep = hours + ':' + minutes.toString().padStart(2, '0');

            var row = document.createElement("tr");
            table.appendChild(row);

            // var depTypeCell = document.createElement("td");
            // depTypeCell.className = "linetype";
            // var typeSymbol = document.createElement("span");
            // typeSymbol.className = this.config.iconTable[departure.type.substring(0,1)];
            // depTypeCell.appendChild(typeSymbol);
            // row.appendChild(depTypeCell);

            var depLineCell = document.createElement("td");
            var lineCell = document.createElement('span');
            depLineCell.className = "lineno line" + departure.line;
            lineCell.innerHTML = departure.line;
            depLineCell.appendChild(lineCell);
            row.appendChild(depLineCell);

            var depTimeCell = document.createElement("td");
            depTimeCell.className = "departuretime";
            depTimeCell.innerHTML = dep;
            row.appendChild(depTimeCell);

            var depClockCell = document.createElement("td");
            depClockCell.className = "departuretime";
            depClockCell.innerHTML = departure.departuretime;
            row.appendChild(depClockCell);

            // if (this.config.fade && this.config.fadePoint < 1) {
            //     if (this.config.fadePoint < 0) {
            //         this.config.fadePoint = 0;
            //     }
            //     var startingPoint = this.config.maximumEntries * this.config.fadePoint;
            //     var steps = this.departures.length - startingPoint;
            //     if (d >= startingPoint) {
            //         var currentStep = d - startingPoint;
            //         row.style.opacity = 1 - (1 / steps * currentStep);
            //     }
            // }

        }
        return table;
    },
    /* scheduleUpdate()
     * Schedule next update.
     *
     * argument delay number - Milliseconds before next update. If empty, 30 seconds is used.
     */
     scheduleUpdate: function(delay) {
        var nextLoad = 30000;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }

        var self = this;
        clearTimeout(this.updateTimer);
        this.updateTimer = setInterval(function() {
            self.updateDom();
        }, nextLoad);
     },
    });
