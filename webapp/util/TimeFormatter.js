sap.ui.define([], function () {
    "use strict";

    return {
        formatTime: function (v) {
            if (!v) return "";

            // Case 1: ISO 8601 duration string
            if (typeof v === "string" && v.indexOf("PT") === 0) {
                var m = v.match(/PT(\d+)H(\d+)M(\d+)S/);
                if (m) {
                    var hh = m[1].padStart(2, "0");
                    var mm = m[2].padStart(2, "0");
                    return hh + ":" + mm;
                }
                return "";
            }

            // Case 2: milliseconds since midnight
            if (typeof v === "number") {
                var totalMin = Math.floor(v / 60000);
                var hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
                var mm = String(totalMin % 60).padStart(2, "0");
                return hh + ":" + mm;
            }

            // Case 3: object with .ms
            if (v && typeof v === "object" && "ms" in v) {
                var totalMin2 = Math.floor(v.ms / 60000);
                var hh2 = String(Math.floor(totalMin2 / 60)).padStart(2, "0");
                var mm2 = String(totalMin2 % 60).padStart(2, "0");
                return hh2 + ":" + mm2;
            }

            return "";
        },

        formatClockOut: function(sClockOut, bInactive) {
            if (!bInactive) {
                return "--:--";
            }

            return this.formatTime(sClockOut);
        },

        formatDate: function (oDate) {
            if (!oDate) return "";
            const d = new Date(oDate);
            return d.toLocaleDateString("he-IL"); // or "en-US" for English
        },

        formatDayName: function (sDay) {
            if (!sDay) return "";
            return sDay.charAt(0).toUpperCase() + sDay.slice(1).toLowerCase();
        },

        toODataDate: function (oDate) {
            return oDate ? "/Date(" + oDate.getTime() + ")/" : null;
        },

        toODataTime: function (sTime) {
            if (!sTime) return null;
            const [hours, minutes] = sTime.split(":");
            return "PT" + hours + "H" + minutes + "M00S";
        },

        toDayName: function (oDate) {
            if (!oDate) return "";
            const sDay = oDate.toLocaleDateString("en-US", { weekday: "long" });
            return sDay.charAt(0).toUpperCase() + sDay.slice(1).toLowerCase();
        },

        toODataTimeNow: function() {
            const oNow = new Date();
            const sTimeStr = [
                oNow.getHours().toString().padStart(2, "0"),
                oNow.getMinutes().toString().padStart(2, "0"),
                oNow.getSeconds().toString().padStart(2, "0")
            ].join(":");
            return this.toODataTime(sTimeStr);
        },

        calcTotalHours: function (sClockIn, sClockOut) {
            if (!sClockIn || !sClockOut) return "0";
            const [inH, inM] = sClockIn.split(":").map(Number);
            const [outH, outM] = sClockOut.split(":").map(Number);

            const inMinutes = inH * 60 + inM;
            const outMinutes = outH * 60 + outM;
            const diff = outMinutes - inMinutes;

            return (diff / 60).toFixed(2); // e.g. "8.50"
        },

        toDateFromODataTime: function(sTime) {
            if (!sTime) return null;

            const str = this.formatTime(sTime); 
            if (!str) return null;

            const [hh, mm] = str.split(":").map(Number);
            const now = new Date();
            now.setHours(hh, mm, 0, 0);
            return now;
        },

        formatElapsed: function (startDate) {
            if (!startDate) return "0:00:00";
            const now = new Date();
            const diffMs = now - startDate;

            const hours   = Math.floor(diffMs / 3600000);
            const minutes = Math.floor((diffMs % 3600000) / 60000);
            const seconds = Math.floor((diffMs % 60000) / 1000);

            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
    };
});
