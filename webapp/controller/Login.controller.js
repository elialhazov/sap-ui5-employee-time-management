sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("employeetimemanagement.controller.Login", {

        onLoginPress: function () {
            let oView = this.getView();
            let sName = oView.byId("inputName").getValue();
            let sPassword = oView.byId("inputPassword").getValue();

            if (!sName || !sPassword) {
                MessageBox.error("Please enter both Name and Password");
                return;
            }
            
            let oModel = this.getView().getModel();
            oModel.setUseBatch(false);
            // Call EmployeeSet POST
            oView.getModel().create("/EmployeeSet", {
                Name: sName,
                Password: sPassword
            }, {
            success: function (oData) {
                MessageToast.show("Login successful");

                const oUserModel = new sap.ui.model.json.JSONModel({
                    name: oData.Name,       
                    email: oData.Email     
                });

                this.getOwnerComponent().setModel(oUserModel, "user");

                let sEmployeeId = oData.EmployeeId;
                let sRole = oData.Role;

                if (sRole === "MANAGER") {
                    this.getOwnerComponent().getRouter().navTo("RouteManagerDashboard");
                    return;
                }

                this.getOwnerComponent().getRouter().navTo("RouteTimeManagement", {
                    employeeId: sEmployeeId
                });

            }.bind(this),
                error: function (oError) {
                    MessageBox.error("Login failed: invalid Name or Password");
                }
            });
        },

        onForgotPasswordPress: function () {
            if (!this._oForgotDialog) {
                this._oForgotDialog = new sap.m.Dialog({
                    title: this.getView().getModel("i18n").getProperty("forgotPassword"),
                    content: [
                        new sap.m.Label({ text: "Enter your email:" }),
                        new sap.m.Input("forgotEmail", { type: "Email", placeholder: "email@example.com" })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Send Reset Link",
                        press: function () {
                            let sEmail = sap.ui.getCore().byId("forgotEmail").getValue();
                            if (!sEmail) {
                                sap.m.MessageBox.error("Please enter your email");
                                return;
                            }
                            
                            // Call OData service to request reset
                            this.getView().getModel().create("/PasswordResetSet", { Email: sEmail }, {
                                success: function () {
                                    sap.m.MessageToast.show("Password reset link sent to your email");
                                    this._oForgotDialog.close();
                                }.bind(this),
                                error: function () {
                                    sap.m.MessageBox.error("Error sending reset link");
                                }
                            });
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this._oForgotDialog.close();
                        }.bind(this)
                    }),
                    afterClose: function () {
                        this._oForgotDialog.destroy();
                        this._oForgotDialog = null;
                    }
                });
            }
            this._oForgotDialog.open();
        }


    });
});
