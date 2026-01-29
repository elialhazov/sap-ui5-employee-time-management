sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "employeetimemanagement/util/TimeFormatter"
], function (Controller, Filter, FilterOperator, TimeFormatter) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.TimeManagement", {

        formatTime: TimeFormatter.formatTime,
        formatClockOut: TimeFormatter.formatClockOut,
        formatDate: TimeFormatter.formatDate,
        formatDayName: TimeFormatter.formatDayName,

        onInit: function () {
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteTimeManagement")
                   .attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            this._sEmployeeId = oEvent.getParameter("arguments").employeeId;

            const oTable   = this.byId("timeRecordTable");
            const oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.filter([
                    new Filter("EmployeeId", FilterOperator.EQ, this._sEmployeeId)
                ]);
            }

            const oModel = this.getView().getModel();
            oModel.read("/TimeRecordSet", {
                filters: [
                    new Filter("EmployeeId", FilterOperator.EQ, this._sEmployeeId)
                ],
                success: (oData) => {
                    const activeLog = oData.results.find(r => !r.Inactive);
                    if (activeLog) {
                        this._oActiveLog = activeLog;
                        this._toggleControls(true);
                        this._startElapsedTimer(activeLog.ClockIn);

                        if (activeLog.ClientId) {
                            this.byId("cbClient").setSelectedKey(activeLog.ClientId);
                        }
                        if (activeLog.TaskDesc) {
                            this.byId("inpTaskDesc").setValue(activeLog.TaskDesc);
                        }
                    }
                }
            });

            this.byId("cbClient").bindItems({
                path: "/EmployeeClientSet",
                filters: [
                    new Filter("EmployeeId", FilterOperator.EQ, this._sEmployeeId)
                ],
                template: new sap.ui.core.ListItem({
                    key: "{ClientId}",
                    text: "{ClientName}"
                })
            });
        },

        onNavigateToRecords: function () {
            this.getOwnerComponent().getRouter().navTo("RouteTimeRecordTable", {
                employeeId: this._sEmployeeId
            });
        },

        _updateControlStates: function (bHasActiveLog, bManual) {
            this.byId("cbClient").setEnabled(!bHasActiveLog);
            this.byId("inpTaskDesc").setEnabled(!bHasActiveLog);

            this.byId("btnStart").setEnabled(!bHasActiveLog && !bManual);
            this.byId("btnStop").setEnabled(bHasActiveLog && !bManual);

            this.byId("dpWorkDate").setEnabled(bManual);
            this.byId("tpClockIn").setEnabled(bManual);
            this.byId("tpClockOut").setEnabled(bManual);
            this.byId("btnSubmitManual").setEnabled(bManual);
            this.byId("swManualMode").setEnabled(!bHasActiveLog);
        },

        _toggleControls: function (bHasActiveLog) {
            this._updateControlStates(bHasActiveLog, false);
        },

        onModeToggle: function (oEvent) {
            const bManual = oEvent.getParameter("state");
            const bHasActiveLog = this._oActiveLog && !this._oActiveLog.Inactive;
            this._updateControlStates(bHasActiveLog, bManual);

            const oAutoBox = this.byId("autoModeBox");
            bManual ? oAutoBox.$().slideUp(300) : oAutoBox.$().slideDown(300);
        },

        // onStartPress: function () {
        //     console.log("START CLICKED");
        //     const oModel = this.getView().getModel();

        //     const oPayload = {
        //         EmployeeId : this._sEmployeeId,
        //         WorkDate   : TimeFormatter.toODataDate(new Date()),
        //         ClockIn    : TimeFormatter.toODataTimeNow(),
        //         ClientId   : this.byId("cbClient").getSelectedKey(),
        //         TaskDesc   : this.byId("inpTaskDesc").getValue()
        //     };

        //     for (const v of Object.values(oPayload)) {
        //         if (!v) {
        //             sap.m.MessageBox.error("All fields are required");
        //             return;
        //         }
        //     }

        //     oModel.create("/TimeRecordSet", oPayload, {
        //         success: (oData) => {
        //             this._oActiveLog = oData;
        //             this._toggleControls(true);
        //             this._startElapsedTimer(new Date());
        //             oModel.refresh();
        //         },
        //         error: (e) => sap.m.MessageBox.error(e.message)
        //     });
        // },

        onStartPress: function () {
    const oModel = this.getView().getModel();

    const oPayload = {
        EmployeeId : this._sEmployeeId,
        WorkDate   : TimeFormatter.toODataDate(new Date()),
        ClockIn    : TimeFormatter.toODataTimeNow(),
        Inactive   : false,
        ClientId   : this.byId("cbClient").getSelectedKey(),
        TaskDesc   : this.byId("inpTaskDesc").getValue()
    };

    // Validation (do not allow empty values)
    if (!oPayload.ClientId) {
        sap.m.MessageBox.error("Please select Client");
        return;
    }

    if (!oPayload.TaskDesc) {
        sap.m.MessageBox.error("Please enter Task");
        return;
    }

    oModel.create("/TimeRecordSet", oPayload, {
        success: (oData) => {
            this._oActiveLog = oData;
            this._toggleControls(true);
            this._startElapsedTimer(new Date());
            oModel.refresh();
        },
        error: (e) => {
            sap.m.MessageBox.error("Failed to start timer");
        }
    });
},

        

        onStopPress: function () {
            if (!this._oActiveLog) return;

            const oModel = this.getView().getModel();
            oModel.update(
                `/TimeRecordSet('${this._oActiveLog.LogId}')`,
                { ClockOut: TimeFormatter.toODataTimeNow() },
                {
                    success: () => {
                        this._oActiveLog = null;
                        this._toggleControls(false);
                        this._stopElapsedTimer();
                        oModel.refresh();
                    }
                }
            );
        },

        _startElapsedTimer: function (clockIn) {
            if (this._timerInterval) {
                clearInterval(this._timerInterval);
            }

            this._startDate = clockIn instanceof Date
                ? clockIn
                : TimeFormatter.toDateFromODataTime(clockIn);

            this.byId("txtTimer")
                .setText(TimeFormatter.formatElapsed(this._startDate));

            this._timerInterval = setInterval(() => {
                this.byId("txtTimer")
                    .setText(TimeFormatter.formatElapsed(this._startDate));
            }, 1000);
        },

        _stopElapsedTimer: function () {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
            this.byId("txtTimer").setText("0:00:00");
        },

        onAddTimeRecord: function () {
            const oModel = this.getView().getModel();

            const oPayload = {
                EmployeeId : this._sEmployeeId,
                WorkDate   : TimeFormatter.toODataDate(this.byId("dpWorkDate").getDateValue()),
                ClockIn    : TimeFormatter.toODataTime(this.byId("tpClockIn").getValue()),
                ClockOut   : TimeFormatter.toODataTime(this.byId("tpClockOut").getValue()),
                ClientId   : this.byId("cbClient").getSelectedKey(),
                TaskDesc   : this.byId("inpTaskDesc").getValue()
            };

            for (const v of Object.values(oPayload)) {
                if (!v) {
                    sap.m.MessageBox.error("All fields are required");
                    return;
                }
            }

            oModel.create("/TimeRecordSet", oPayload, {
                success: () => {
                    oModel.refresh();
                    this._clearFields();
                }
            });
        },

        _clearFields: function () {
            this.byId("cbClient").setSelectedKey("");
            this.byId("inpTaskDesc").setValue("");
            this.byId("dpWorkDate").setDateValue(null);
            this.byId("tpClockIn").setValue("");
            this.byId("tpClockOut").setValue("");
            this.byId("txtTimer").setText("0:00:00");
        }
    });
});

