sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Text",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/CheckBox",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (
    Controller,
    JSONModel,
    Text,
    Column,
    ColumnListItem,
    CheckBox,
    MessageToast,
    MessageBox
) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.ClientsManagement", {

        onInit: function () {},

        onAfterRendering: function () {
            if (this._bLoaded) {
                return;
            }
            this._bLoaded = true;

            const oModel = this.getOwnerComponent().getModel();
            if (!oModel) {
                return;
            }

            oModel.read("/EmployeeClientAdminSet", {
                success: function (oData) {
                    if (oData.results && oData.results.length) {
                        this._buildMatrix(oData.results);
                    }
                }.bind(this),
                error: function () {
                    MessageToast.show("Failed to load clients data");
                }
            });
        },

        onNavBack: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteManagerDashboard");
        },

        /* ================= MATRIX DATA ================= */
        _buildMatrix: function (aData) {

            const mClients = {};
            const aEmployees = [];

            // Collect unique employees
            aData.forEach(r => {
                if (r.EmployeeId && r.Name && !aEmployees.find(e => e.id === r.EmployeeId)) {
                    aEmployees.push({
                        id: r.EmployeeId,
                        name: r.Name
                    });
                }
            });

            if (!aEmployees.length) {
                return;
            }

            // Build client rows (keep ClientId!)
            aData.forEach(r => {
                if (!mClients[r.ClientId]) {
                    mClients[r.ClientId] = {
                        ClientId: r.ClientId,
                        ClientName: r.ClientName
                    };
                    aEmployees.forEach(e => {
                        mClients[r.ClientId][e.id] = false;
                    });
                }
                mClients[r.ClientId][r.EmployeeId] = true;
            });

            const oMatrixModel = new JSONModel({
                employees: aEmployees,
                rows: Object.values(mClients)
            });

            this.getView().setModel(oMatrixModel, "matrix");
            this._renderTable();
        },

        /* ================= TABLE RENDER ================= */
        _renderTable: function () {
            const oTable = this.byId("matrixTable");
            const oModel = this.getView().getModel("matrix");

            if (!oTable || !oModel) {
                return;
            }

            oTable.removeAllColumns();
            oTable.removeAllItems();

            // ---- Client column ----
            oTable.addColumn(new Column({
                header: new Text({ text: "Client" }),
                width: "14rem"
            }));

            // ---- Employee columns ----
            oModel.getProperty("/employees").forEach(emp => {
                oTable.addColumn(new Column({
                    header: new Text({
                        text: emp.name,
                        textAlign: "Center"
                    }),
                    hAlign: "Center",
                    width: "8rem"
                }));
            });

            // ---- Rows ----
            oTable.bindItems({
                path: "matrix>/rows",
                factory: function (sId, oCtx) {

                    const aCells = [];

                    // Client name
                    aCells.push(new Text({
                        text: oCtx.getProperty("ClientName")
                    }));

                    // Checkboxes
                    oModel.getProperty("/employees").forEach(emp => {
                        aCells.push(new CheckBox({
                            selected: oCtx.getProperty(emp.id),
                            tooltip: emp.name,
                            select: function (oEvent) {
                                this._onToggleAssignment(
                                    oEvent,
                                    emp.id,
                                    oCtx.getProperty("ClientId")
                                );
                            }.bind(this)
                        }));
                    });

                    return new ColumnListItem({
                        cells: aCells,
                        type: "Inactive"
                    });
                }.bind(this)
            });
        },

        /* ================= CREATE / DELETE ================= */
        _onToggleAssignment: function (oEvent, sEmployeeId, sClientId) {

            const bSelected = oEvent.getParameter("selected");
            const oModel = this.getOwnerComponent().getModel();

            if (bSelected) {
                // CREATE
                oModel.create("/EmployeeClientAdminSet", {
                    EmployeeId: sEmployeeId,
                    ClientId: sClientId
                }, {
                    success: function () {
                        MessageToast.show("Client assigned");
                    },
                    error: function () {
                        MessageBox.error("Failed to assign client");
                    }
                });

            } else {
                // DELETE
                const sKey = oModel.createKey("/EmployeeClientAdminSet", {
                    EmployeeId: sEmployeeId,
                    ClientId: sClientId
                });

                oModel.remove(sKey, {
                    success: function () {
                        MessageToast.show("Client removed");
                    },
                    error: function () {
                        MessageBox.error("Failed to remove client");
                    }
                });
            }
        }

    });
});