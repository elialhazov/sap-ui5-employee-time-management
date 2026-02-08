sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.ManagerDashboard", {

        onViewEmployee: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) {
                return;
            }

            const sEmployeeId = oCtx.getProperty("EmployeeId");

            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteTimeRecordTable", {
                    employeeId: sEmployeeId
                });
        },

        /* 🔑 Client Permissions – per employee */
        onAssignClients: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) {
                return;
            }

            const sEmployeeId = oCtx.getProperty("EmployeeId");

            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteEmployeeClientPermissions", {
                    employeeId: sEmployeeId
                });
        },

        /* Global matrix */
        onManageClients: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteClientsManagement");
        }

    });
});