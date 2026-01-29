sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.ManagerDashboard", {

        onInit: function () {
        },

        onViewEmployee: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            const sEmployeeId = oCtx.getProperty("EmployeeId");

            this.getOwnerComponent().getRouter().navTo(
                "RouteTimeRecordTable",
                { employeeId: sEmployeeId }
            );
        }

    });
});
