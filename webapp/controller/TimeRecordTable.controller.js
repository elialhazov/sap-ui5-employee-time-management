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
        formatDayName: TimeFormatter.formatDayName,

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteTimeRecordTable").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            this._sEmployeeId = oEvent.getParameter("arguments").employeeId;
            const oSmartTable = this.byId("smartTimeRecordTable");

            oSmartTable.attachBeforeRebindTable((oEvent) => {
                const oBindingParams = oEvent.getParameter("bindingParams");
                // Force filter by employee
                oBindingParams.filters.push(
                    new sap.ui.model.Filter("EmployeeId", sap.ui.model.FilterOperator.EQ, this._sEmployeeId)
                );
            });
        },

        // onRowPress: function(oEvent) {
        //     const oItem = oEvent.getSource(); // ColumnListItem clicked

        //     const oDetailVBox = oItem.getCells().find(c => c.isA && c.isA("sap.m.VBox"));
        //     if (!oDetailVBox) return;

        //     // Toggle the clicked row
        //     const bVisible = oDetailVBox.getVisible();
        //     oDetailVBox.setVisible(!bVisible);

        //     // Collapse other rows
        //     oItem.getParent().getItems().forEach(item => {
        //         if (item !== oItem) {
        //             const detail = item.getCells().find(c => c.isA && c.isA("sap.m.VBox"));
        //             if (detail) detail.setVisible(false);
        //         }
        //     });
        // },

        onNavigateToAddRecord: function() {
            this.getOwnerComponent().getRouter().navTo("RouteTimeManagement", {
                employeeId: this._sEmployeeId
            });
        }

    });
});
