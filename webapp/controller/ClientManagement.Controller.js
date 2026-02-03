sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.ClientsManagement", {

        onInit: function () {
            const oModel = new JSONModel({ items: [] });
            this.getView().setModel(oModel, "employees");
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteManagerDashboard");
        },

        onClientSelect: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oClient = oItem.getBindingContext().getObject();

            const sClientId = oClient.ClientId;

            // TODO: Replace with real OData call
            // /EmployeeClientSet?$filter=ClientId eq 'XXX'

            const aEmployees = [
                { EmployeeId: "1001", Name: "OFER", Assigned: true },
                { EmployeeId: "1002", Name: "AMIT", Assigned: false },
                { EmployeeId: "1003", Name: "DANA", Assigned: true }
            ];

            this.getView()
                .getModel("employees")
                .setProperty("/items", aEmployees);
        },

        onToggleEmployee: function () {
            // שינוי מתבצע ישירות במודל (Two-way binding)
        },

        onSave: function () {
            // TODO: POST / DELETE ל־EmployeeClientSet
            MessageToast.show("Client permissions saved successfully");
        }

    });
});
