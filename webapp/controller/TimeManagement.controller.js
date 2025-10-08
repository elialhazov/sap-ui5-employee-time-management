sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "employeetimemanagement/util/TimeFormatter",
], function (Controller, Filter, FilterOperator, TimeFormatter) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.TimeManagement", {
        formatTime: TimeFormatter.formatTime,
        formatClockOut: TimeFormatter.formatClockOut,
        formatDate: TimeFormatter.formatDate,
        formatDayName: TimeFormatter.formatDayName,

        onInit: function () {
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteTimeManagement").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            this._sEmployeeId = oEvent.getParameter("arguments").employeeId;
            let oTable = this.byId("timeRecordTable");
            let oBinding = oTable.getBinding("items");

            if (oBinding) {
                let oFilter = new Filter("EmployeeId", FilterOperator.EQ, this._sEmployeeId);
                oBinding.filter([oFilter]);

                const oModel = this.getView().getModel();
                oModel.read("/TimeRecordSet", {
                    filters: [
                        new Filter("EmployeeId", FilterOperator.EQ, this._sEmployeeId)
                    ],
                    success: (oData) => {
                        const activeLog = oData.results.find(r => !r.Inactive);
                        if (activeLog) {
                            this._oActiveLog = activeLog || null;
                            // this._bHasActiveLog = true;
                            // this._sActiveLogId = activeLog.LogId;
                            this._toggleControls(!this._oActiveLog.Inactive);
                            this._startElapsedTimer(activeLog.ClockIn);
                            console.log("Active log (" + this._oActiveLog.LogId  + ") for employee " + this._oActiveLog.EmployeeId + ": " + !this._oActiveLog.Inactive);
                            if (activeLog.ClientName) {
                                let oComboBox = this.byId("cbClient");
                                oComboBox.setValue(activeLog.ClientName);
                            }
                            if (activeLog.TaskDesc) {
                                this.byId("inpTaskDesc").setValue(activeLog.TaskDesc);
                            }
                        } else {
                            // this._bHasActiveLog = false;
                            // this._sActiveLogId = null;
                        }
                    }   
                });
            }

            let oComboBox = this.byId("cbClient");
            oComboBox.bindItems({
                path: "/EmployeeClientSet",
                filters: [new Filter("EmployeeId", FilterOperator.EQ, this._sEmployeeId)],
                template: new sap.ui.core.ListItem({
                    key: "{ClientId}",
                    text: "{ClientName}"
                })
            });
        },

        onNavigateToRecords: function() {
            this.getOwnerComponent().getRouter().navTo("RouteTimeRecordTable", {
                employeeId: this._sEmployeeId
            });
        },

        _updateControlStates: function(bHasActiveLog, bManual) {
            this.byId("cbClient").setEnabled(!bHasActiveLog);
            this.byId("inpTaskDesc").setEnabled(!bHasActiveLog);
            
            if (bManual) {
                this.byId("btnStart").setEnabled(false);
                this.byId("btnStop").setEnabled(false);
            } else {
                this.byId("btnStart").setEnabled(!bHasActiveLog);
                this.byId("btnStop").setEnabled(bHasActiveLog);
            }
            
            this.byId("dpWorkDate").setEnabled(bManual);
            this.byId("tpClockIn").setEnabled(bManual);
            this.byId("tpClockOut").setEnabled(bManual);
            this.byId("btnSubmitManual").setEnabled(bManual);
            this.byId("swManualMode").setEnabled(!bHasActiveLog);
        },

        _toggleControls: function(bHasActiveLog) {
            this._updateControlStates(bHasActiveLog, false);
        },

        onModeToggle: function(oEvent) {
            let bManual = oEvent.getParameter("state");
            let bHasActiveLog = this._oActiveLog ? !this._oActiveLog.Inactive : false;
            this._updateControlStates(bHasActiveLog, bManual);
            // this.byId("autoModeBox").setVisible(!bManual);

            const oAutoBox = this.byId("autoModeBox");

            if (bManual) {
                // Collapse with animation
                oAutoBox.$().slideUp(300); // 300ms animation
            } else {
                // Expand with animation
                oAutoBox.$().slideDown(300);
            }
        },

        onStartPress: function () {
            const oModel = this.getView().getModel();
            const sEmployeeId = this._sEmployeeId;
            const sClockIn = TimeFormatter.toODataTimeNow();

            const oPayload = {
                EmployeeId : sEmployeeId,
                WorkDate   : TimeFormatter.toODataDate(new Date()),
                DayName    : TimeFormatter.toDayName(new Date()),
                ClockIn    : sClockIn,         
                ClientName : this.byId("cbClient").getSelectedItem()?.getText(),
                TaskDesc   : this.byId("inpTaskDesc").getValue()
            };

            for (const [key, value] of Object.entries(oPayload)) {
                if (value === null || value === undefined || value === "") {
                    sap.m.MessageBox.error(`${key.replace(/([A-Z])/g, ' $1')} is required.`);
                    return;
                }
            }

            oModel.create("/TimeRecordSet", oPayload, {
                success: (oData) => {
                    sap.m.MessageToast.show(this.getView().getModel("i18n").getProperty("recordStarted"));
                    this._oActiveLog = oData;
                    oModel.refresh();
                    this._toggleControls(true);
                    this._startElapsedTimer(new Date());
                },
                error: (oError) => {
                    sap.m.MessageBox.error(oError.message);
                }
            });
        },

        onStopPress: function() {
            if (this._oActiveLog.Inactive) return;

            const oModel = this.getView().getModel();
            const sLogId = this._oActiveLog.LogId;
            const sClockIn = this._oActiveLog.ClockIn;
            const sClockOut = TimeFormatter.toODataTimeNow();

            const oPayload = {
                ClockOut   : sClockOut,
                TotalHours : TimeFormatter.calcTotalHours(TimeFormatter.formatTime(sClockIn), TimeFormatter.formatTime(sClockOut))
            };

            oModel.update("/TimeRecordSet('" + sLogId + "')", oPayload, {
                success: () => {
                    sap.m.MessageToast.show(this.getView().getModel("i18n").getProperty("recordAdded"));
                    oModel.refresh();
                    this._oActiveLog = null;
                    this._toggleControls(false);
                    this._stopElapsedTimer();
                },
                error: (oError) => {
                    sap.m.MessageBox.error(oError.message);
                }
            });
        },

        _startElapsedTimer: function(clockIn) {
            if (this._timerInterval) {
                clearInterval(this._timerInterval);
            }

            if (clockIn instanceof Date) {
                this._startDate = clockIn;
            } else {
                // parse server string to Date
                this._startDate = TimeFormatter.toDateFromODataTime(clockIn);
            }

            // immediate update so we show 0:00:00 right away if startDate === now
            this.byId("txtTimer").setText(TimeFormatter.formatElapsed(this._startDate));

            this._timerInterval = setInterval(() => {
                this.byId("txtTimer").setText(TimeFormatter.formatElapsed(this._startDate));
            }, 1000);
        },
        
        _stopElapsedTimer: function() {
            if (this._timerInterval) {
                clearInterval(this._timerInterval);
                this._timerInterval = null;
            }
            this.byId("txtTimer").setText("0:00:00");
        },


        onInputChange: function () {
            const oDate     = this.byId("dpWorkDate").getDateValue();
            const sClockIn  = this.byId("tpClockIn").getValue();
            const sClockOut = this.byId("tpClockOut").getValue();

            const sDayName    = TimeFormatter.toDayName(oDate);
            const sTotalHours = TimeFormatter.calcTotalHours(sClockIn, sClockOut);

            this.byId("txtDayName").setText(sDayName || "");
            this.byId("txtTotalHours").setText(sTotalHours || "");
        },
        
        onAddTimeRecord: function () {
            const oModel = this.getView().getModel();
            const sEmployeeId = this._sEmployeeId;

            const oDate       = this.byId("dpWorkDate").getDateValue();
            const sClockIn    = this.byId("tpClockIn").getValue();
            const sClockOut   = this.byId("tpClockOut").getValue();
            const sClientName = this.byId("cbClient").getSelectedItem()?.getText() || "";
            const sTaskDesc   = this.byId("inpTaskDesc").getValue()

            const oPayload = {
                EmployeeId : sEmployeeId,
                WorkDate   : TimeFormatter.toODataDate(oDate),
                DayName    : TimeFormatter.toDayName(oDate),
                ClockIn    : TimeFormatter.toODataTime(sClockIn),
                ClockOut   : TimeFormatter.toODataTime(sClockOut),
                TotalHours : TimeFormatter.calcTotalHours(sClockIn, sClockOut),
                ClientName : sClientName,
                TaskDesc   : sTaskDesc,
            };
            
            for (const [key, value] of Object.entries(oPayload)) {
                if (value === null || value === undefined || value === "") {
                    sap.m.MessageBox.error(`${key.replace(/([A-Z])/g, ' $1')} is required.`);
                    return;
                }
            }

            oModel.create("/TimeRecordSet", oPayload, {
                success: () => {
                    sap.m.MessageToast.show(this.getView().getModel("i18n").getProperty("recordAdded"));
                    oModel.refresh(); // refresh table
                    this._clearFields();
                },
                error: (oError) => {
                    let sMsg = (oError.responseText && JSON.parse(oError.responseText).error?.innererror?.errordetails?.[0]?.message) 
                            || oError.message 
                            || "Unknown error";
                    sap.m.MessageBox.error(sMsg);
                }
            });
        },

        _clearFields: function() {
            const oComboBox = this.byId("cbClient");
            if (oComboBox) oComboBox.setSelectedKey("");

            const oTaskInput = this.byId("inpTaskDesc");
            if (oTaskInput) oTaskInput.setValue("");

            const oDatePicker = this.byId("dpWorkDate");
            if (oDatePicker) oDatePicker.setDateValue("");

            const oClockIn = this.byId("tpClockIn");
            if (oClockIn) oClockIn.setValue("");

            const oClockOut = this.byId("tpClockOut");
            if (oClockOut) oClockOut.setValue("");

            const oTimer = this.byId("txtTimer");
            if (oTimer) oTimer.setText("0:00:00");

            this.byId("txtDayName").setText("");
            this.byId("txtTotalHours").setText("");
        }

    });
});
