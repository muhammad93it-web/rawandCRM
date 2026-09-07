import { Route } from "wouter";
import Workplaces from "@/pages/workplaces";
import UserManagement from "@/pages/user-management";
import GeneralConfigurations from "@/pages/general-configurations";
import AccountingConfigurations from "@/pages/accounting-configurations";
import StoreConfig from "@/pages/store-config";
import { EmployeesList, GroupsList, UsersList } from "@/pages/organization-lists";
import { PurchaseIssueConfig } from "@/pages/business-documents";
import { stubRoutes } from "./stub";

/** Area: config-org — workplaces, users, groups, employees, drivers, all configuration tab pages. */
export const configOrgRoutes = [
  <Route key="/workplaces" path="/workplaces" component={Workplaces} />,
  <Route key="/usermanagement" path="/usermanagement" component={UserManagement} />,
  <Route key="/users" path="/users" component={UsersList} />,
  <Route key="/groups" path="/groups" component={GroupsList} />,
  <Route key="/employeelist" path="/employeelist" component={EmployeesList} />,
  <Route key="/generalconfigurations" path="/generalconfigurations" component={GeneralConfigurations} />,
  <Route key="/accountingconfigurations" path="/accountingconfigurations" component={AccountingConfigurations} />,
  <Route key="/accountconfiguration" path="/accountconfiguration" component={AccountingConfigurations} />,
  <Route key="/storeconfig" path="/Storeconfig" component={StoreConfig} />,
  <Route key="/purchaseissueconfig" path="/purchaseissueconfig" component={PurchaseIssueConfig} />,
  ...stubRoutes(["/workplace/:id", "/user/:id", "/addemployee/:id", "/drivers"]),
];
