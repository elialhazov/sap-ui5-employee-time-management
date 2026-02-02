sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "employeetimemanagement/util/TimeFormatter"
], function (Controller, Filter, FilterOperator, TimeFormatter) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.TimeRecordTable", {

        formatTime: TimeFormatter.formatTime,
        formatClockOut: TimeFormatter.formatClockOut,
        formatDate: TimeFormatter.formatDate,

            formatDayFromDate: function (oDate) {
            if (!oDate) {
                return "";
            }

            const oJsDate = oDate instanceof Date ? oDate : new Date(oDate);

            return oJsDate.toLocaleDateString("en-US", {
                weekday: "long"
            });
        },    

formatTotalTime: function (vClockIn, vClockOut) {
    if (!vClockIn || !vClockOut) {
        return "--:--";
    }

    let inMs, outMs;

    // OData Edm.Time (most common)
    if (typeof vClockIn === "object" && vClockIn.ms !== undefined) {
        inMs = vClockIn.ms;
    }

    if (typeof vClockOut === "object" && vClockOut.ms !== undefined) {
        outMs = vClockOut.ms;
    }

    // Fallback – string / Date
    if (inMs === undefined) {
        inMs = new Date(vClockIn).getTime();
    }
    if (outMs === undefined) {
        outMs = new Date(vClockOut).getTime();
    }

    if (isNaN(inMs) || isNaN(outMs) || outMs < inMs) {
        return "--:--";
    }

    const diffMs = outMs - inMs;
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
},
        

        onInit: function () {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.getRoute("RouteTimeRecordTable")
        .attachPatternMatched(this._onRouteMatched, this);

    this._initYearSelect();
    this._oMonthYearFilter = null;

    // === Cache for ClientId → ClientName ===
    this._mClientMap = {};

    // === Monthly standard model ===
    this.getView().setModel(
        new sap.ui.model.json.JSONModel({
            visible: false,
            workDays: 0,
            hours: 0
        }),
        "standard"
    );

    // === Total hours model ===
    this.getView().setModel(
        new sap.ui.model.json.JSONModel({
            hours: "00:00"
        }),
        "totals"
    );
},


        /* =========================================================== */
        /* Route                                                       */
        /* =========================================================== */

_onRouteMatched: function (oEvent) {
    this._sEmployeeId = oEvent.getParameter("arguments").employeeId;

    const oSmartTable = this.byId("smartTimeRecordTable");

    // Prevent double attach
    if (this._bBeforeRebindAttached) {
        return;
    }
    this._bBeforeRebindAttached = true;

    // Load employee clients once
    this._loadEmployeeClients();

    // === Apply filters before OData rebind ===
    oSmartTable.attachBeforeRebindTable((oEvent) => {
        const oBindingParams = oEvent.getParameter("bindingParams");

        if (!oBindingParams.filters) {
            oBindingParams.filters = [];
        }

        // Always filter by employee
        oBindingParams.filters.push(
            new Filter("EmployeeId", FilterOperator.EQ, this._sEmployeeId)
        );

        // Month / Year filter (optional)
        if (this._oMonthYearFilter) {
            oBindingParams.filters.push(...this._oMonthYearFilter);
        }
    });

    // === Calculate total hours after table update ===
    const oTable = oSmartTable.getTable();
    oTable.attachUpdateFinished(() => {
        this._calculateTotalHours();
    });
},


        /* =========================================================== */
        /* Load Clients (ClientId → ClientName)                        */
        /* =========================================================== */

        _loadEmployeeClients: function () {
            const oModel = this.getView().getModel();

            oModel.read("/EmployeeClientSet", {
                filters: [
                    new Filter("EmployeeId", FilterOperator.EQ, this._sEmployeeId)
                ],
                success: (oData) => {
                    oData.results.forEach(oRow => {
                        this._mClientMap[oRow.ClientId] = oRow.ClientName;
                    });
                }
            });
        },

        /* =========================================================== */
        /* Formatter                                                   */
        /* =========================================================== */

        formatClientName: function (sClientId) {
            return this._mClientMap[sClientId] || sClientId || "";
        },

        /* =========================================================== */
        /* Year Select Init                                            */
        /* =========================================================== */

        _initYearSelect: function () {
            const oYearSelect = this.byId("selYear");
            if (!oYearSelect) return;

            oYearSelect.removeAllItems();

            const iStartYear = 2006;
            const iCurrentYear = new Date().getFullYear();

            for (let i = iCurrentYear; i >= iStartYear; i--) {
                oYearSelect.addItem(
                    new sap.ui.core.Item({
                        key: i.toString(),
                        text: i.toString()
                    })
                );
            }

            oYearSelect.setSelectedKey(iCurrentYear.toString());
        },

        /* =========================================================== */
        /* Month / Year Filter                                         */
        /* =========================================================== */

onApplyMonthYearFilter: function () {

    const sYear  = this.byId("selYear").getSelectedKey();
    const sMonth = this.byId("selMonth").getSelectedKey();

    if (!sYear || !sMonth) {
        sap.m.MessageToast.show("Please select month and year");
        return;
    }

    const iYear  = parseInt(sYear, 10);
    const iMonth = parseInt(sMonth, 10) - 1;

    // === calculate standard (NEW) ===
    const oStandard = this._calculateMonthlyStandard(iYear, iMonth);

    this.getView().getModel("standard").setData({
        visible: true,
        workDays: oStandard.workDays,
        hours: oStandard.hours
    });

    // === existing filter logic (UNCHANGED) ===
    const dFrom = new Date(iYear, iMonth, 1);
    const dTo   = new Date(iYear, iMonth + 1, 0, 23, 59, 59);

    this._oMonthYearFilter = [
        new sap.ui.model.Filter(
            "WorkDate",
            sap.ui.model.FilterOperator.BT,
            dFrom,
            dTo
        )
    ];

    this.byId("smartTimeRecordTable").rebindTable();
},



onClearMonthYearFilter: function () {
    this.getView().getModel("standard").setData({
    visible: false,
    workDays: 0,
    hours: 0
});


    this._oMonthYearFilter = null;

    this.byId("selMonth").setSelectedKey("");
    this.byId("selYear").setSelectedKey(
        new Date().getFullYear().toString()
    );

    this.byId("smartTimeRecordTable").rebindTable();
}
,


        /* =========================================================== */
        /* Navigation                                                  */
        /* =========================================================== */

        onNavigateToAddRecord: function () {
            this.getOwnerComponent().getRouter().navTo("RouteTimeManagement", {
                employeeId: this._sEmployeeId
            });
        },

 _calculateMonthlyStandard: function (iYear, iMonth) {
    let iWorkDays = 0;
    const oDate = new Date(iYear, iMonth, 1);

    while (oDate.getMonth() === iMonth) {
        const iDay = oDate.getDay(); 
        // 0=Sunday … 6=Saturday

        if (iDay >= 0 && iDay <= 4) {
            // Sunday–Thursday
            iWorkDays++;
        }

        oDate.setDate(oDate.getDate() + 1);
    }

    return {
        workDays: iWorkDays,
        hours: iWorkDays * 9
    };
},

_calculateTotalHours: function () {
    const oTable = this.byId("smartTimeRecordTable").getTable();
    const oBinding = oTable.getBinding("items");

    if (!oBinding) {
        return;
    }

    let totalMinutes = 0;

    oBinding.getCurrentContexts().forEach(oCtx => {
        const oData = oCtx.getObject();

        if (oData.ClockIn && oData.ClockOut &&
            oData.ClockIn.ms !== undefined &&
            oData.ClockOut.ms !== undefined) {

            const diffMs = oData.ClockOut.ms - oData.ClockIn.ms;
            if (diffMs > 0) {
                totalMinutes += Math.floor(diffMs / 60000);
            }
        }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    this.getView().getModel("totals").setProperty(
        "/hours",
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    );
},

       
        

    });
});

