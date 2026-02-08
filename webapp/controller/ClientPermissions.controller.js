sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.ClientPermissions", {

        onInit: function () {
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteEmployeeClientPermissions")
                .attachPatternMatched(this._onMatched, this);
        },

        _onMatched: function (oEvent) {
            this._employeeId = oEvent.getParameter("arguments").employeeId;

            this.getView().setModel(new JSONModel({
                employeeId: this._employeeId,
                employeeName: ""
            }), "view");

            this._loadData();
        },

        _loadData: function () {
            const oOData = this.getOwnerComponent().getModel();

            oOData.read("/EmployeeClientAdminSet", {
                success: function (oData) {

                    const mAssigned = {};
                    oData.results.forEach(r => {
                        if (r.EmployeeId === this._employeeId) {
                            mAssigned[r.ClientId] = true;
                        }
                    });

                    const aClients = [];
                    oData.results.forEach(r => {
                        if (!aClients.find(c => c.ClientId === r.ClientId)) {
                            aClients.push({
                                ClientId: r.ClientId,
                                ClientName: r.ClientName,
                                assigned: !!mAssigned[r.ClientId]
                            });
                        }
                    });

                    this.getView().setModel(new JSONModel(aClients), "clients");

                }.bind(this),
                error: function () {
                    MessageBox.error("Failed to load client permissions");
                }
            });
        },

        onToggleClient: function (oEvent) {
            const bSelected = oEvent.getParameter("selected");
            const oCtx = oEvent.getSource().getBindingContext("clients");
            const oClient = oCtx.getObject();
            const oModel = this.getOwnerComponent().getModel();

            if (bSelected) {
                oModel.create("/EmployeeClientAdminSet", {
                    EmployeeId: this._employeeId,
                    ClientId: oClient.ClientId
                });
            } else {
                const sKey = oModel.createKey("/EmployeeClientAdminSet", {
                    EmployeeId: this._employeeId,
                    ClientId: oClient.ClientId
                });
                oModel.remove(sKey);
            }
        },

        onNavBack: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteManagerDashboard");
        }

    });
});