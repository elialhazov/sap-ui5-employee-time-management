sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.ManagerDashboard", {


        onViewEmployee: function (oEvent) {
            const oSource = oEvent.getSource();
            const oCtx = oSource.getBindingContext();

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


        onAssignClients: function (oEvent) {
            const oSource = oEvent.getSource();
            const oCtx = oSource.getBindingContext();

            if (!oCtx) {
                return;
            }

            const sEmployeeId = oCtx.getProperty("EmployeeId");

            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteEmployeeClients", {
                    employeeId: sEmployeeId
                });
        },


        onManageClients: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteClientsManagement");
        },

        onAssignClients: function (oEvent) {
    const sEmployeeId = oEvent.getSource()
        .getBindingContext()
        .getProperty("EmployeeId");

    this.getOwnerComponent()
        .getRouter()
        .navTo("RouteEmployeeClientPermissions", {
            employeeId: sEmployeeId
        });
}

    });
});
